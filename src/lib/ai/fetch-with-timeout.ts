const DEFAULT_AI_TIMEOUT_MS = 65_000;
const MIN_AI_TIMEOUT_MS = 5_000;
const MAX_AI_TIMEOUT_MS = 120_000;
const DEFAULT_AI_MAX_ATTEMPTS = 2;
const MAX_AI_ATTEMPTS = 3;
const MAX_RETRY_DELAY_MS = 2_000;
const MIN_RETRY_BUDGET_MS = 1_000;

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

type AiFetchOptions = {
  timeoutMs?: number;
  maxAttempts?: number;
  fetchImpl?: typeof fetch;
  sleep?: (delayMs: number) => Promise<void>;
  now?: () => number;
  random?: () => number;
};

export type AiFetchResult = {
  response: Response;
  attempts: number;
};

function getAiTimeoutMs() {
  const configured = Number(process.env.AI_REQUEST_TIMEOUT_MS);

  if (!Number.isFinite(configured)) {
    return DEFAULT_AI_TIMEOUT_MS;
  }

  return Math.min(
    Math.max(Math.trunc(configured), MIN_AI_TIMEOUT_MS),
    MAX_AI_TIMEOUT_MS,
  );
}

function getAiMaxAttempts() {
  const configured = Number(process.env.AI_MAX_ATTEMPTS);

  if (!Number.isFinite(configured)) {
    return DEFAULT_AI_MAX_ATTEMPTS;
  }

  return Math.min(Math.max(Math.trunc(configured), 1), MAX_AI_ATTEMPTS);
}

function retryDelayMs(
  response: Response | null,
  attempt: number,
  nowMs: number,
  random: () => number,
) {
  const retryAfter = response?.headers.get("Retry-After")?.trim();

  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(seconds * 1_000, MAX_RETRY_DELAY_MS);
    }

    const retryAt = Date.parse(retryAfter);
    if (Number.isFinite(retryAt)) {
      return Math.min(Math.max(retryAt - nowMs, 0), MAX_RETRY_DELAY_MS);
    }
  }

  const exponentialDelay = 250 * 2 ** Math.max(0, attempt - 1);
  return Math.min(exponentialDelay + Math.floor(random() * 100), MAX_RETRY_DELAY_MS);
}

function wait(delayMs: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, delayMs));
}

function timeoutError() {
  return new Error("AI_TIMEOUT: The AI provider took too long to respond.");
}

/**
 * Retries only short-lived provider and network failures while keeping every
 * attempt inside one total request budget.
 */
export async function fetchWithAiRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: AiFetchOptions = {},
): Promise<AiFetchResult> {
  const timeoutMs = options.timeoutMs ?? getAiTimeoutMs();
  const maxAttempts = options.maxAttempts ?? getAiMaxAttempts();
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? wait;
  const now = options.now ?? Date.now;
  const random = options.random ?? Math.random;
  const deadline = now() + Math.max(1, timeoutMs);

  for (let attempt = 1; attempt <= Math.max(1, maxAttempts); attempt += 1) {
    const remainingMs = deadline - now();
    if (remainingMs <= 0) throw timeoutError();

    const controller = new AbortController();
    const parentSignal = init?.signal;
    const abortFromParent = () => controller.abort(parentSignal?.reason);
    parentSignal?.addEventListener("abort", abortFromParent, { once: true });
    const timeout = setTimeout(() => controller.abort(), remainingMs);

    try {
      const response = await fetchImpl(input, {
        ...init,
        signal: controller.signal,
      });

      const canRetry =
        RETRYABLE_STATUS_CODES.has(response.status) &&
        attempt < maxAttempts;

      if (!canRetry) {
        return { response, attempts: attempt };
      }

      const delayMs = retryDelayMs(response, attempt, now(), random);
      if (deadline - now() <= delayMs + MIN_RETRY_BUDGET_MS) {
        return { response, attempts: attempt };
      }

      await response.body?.cancel().catch(() => undefined);
      await sleep(delayMs);
    } catch (error) {
      if (parentSignal?.aborted) throw error;
      if (controller.signal.aborted || deadline - now() <= 0) {
        throw timeoutError();
      }

      if (attempt >= maxAttempts) {
        throw new Error("AI_PROVIDER_UNAVAILABLE: The AI provider could not be reached.");
      }

      const delayMs = retryDelayMs(null, attempt, now(), random);
      if (deadline - now() <= delayMs + MIN_RETRY_BUDGET_MS) {
        throw new Error("AI_PROVIDER_UNAVAILABLE: The AI provider could not be reached.");
      }

      await sleep(delayMs);
    } finally {
      clearTimeout(timeout);
      parentSignal?.removeEventListener("abort", abortFromParent);
    }
  }

  throw new Error("AI_PROVIDER_UNAVAILABLE: The AI provider could not be reached.");
}

export async function fetchWithAiTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const { response } = await fetchWithAiRetry(input, init, { maxAttempts: 1 });
  return response;
}
