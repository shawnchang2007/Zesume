const DEFAULT_AI_TIMEOUT_MS = 45_000;
const MIN_AI_TIMEOUT_MS = 5_000;
const MAX_AI_TIMEOUT_MS = 120_000;

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

export async function fetchWithAiTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getAiTimeoutMs());

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("AI_TIMEOUT: The AI provider took too long to respond.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
