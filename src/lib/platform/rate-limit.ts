import { getCloudflareContext } from "@opennextjs/cloudflare";

type RateLimiter = {
  limit(input: { key: string }): Promise<{ success: boolean }>;
};

type RateLimitEnvironment = {
  RESUME_REWRITE_RATE_LIMITER?: RateLimiter;
  AUTH_EMAIL_RATE_LIMITER?: RateLimiter;
};

function getAnonymousActor(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "anonymous"
  );
}

async function hashActor(actor: string) {
  const bytes = new TextEncoder().encode(actor);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function checkPlatformRateLimit(bindingName: keyof RateLimitEnvironment, actor: string) {
  try {
    const { env } = getCloudflareContext();
    const limiter = (env as RateLimitEnvironment)[bindingName];

    // Local Next.js development has no Cloudflare binding, so it remains usable.
    if (!limiter) return true;

    const result = await limiter.limit({ key: await hashActor(actor) });
    return result.success;
  } catch {
    // Database cooldowns and attempt limits still protect email login if the
    // platform binding is temporarily unavailable.
    return true;
  }
}

export function checkAuthEmailRateLimit(
  request: Request,
  action: "request" | "verify",
) {
  const actor = getAnonymousActor(request);
  return checkPlatformRateLimit(
    "AUTH_EMAIL_RATE_LIMITER",
    `auth-email:${action}:ip:${actor}`,
  );
}

export async function checkResumeRewriteRateLimit(
  request: Request,
  userId?: string,
) {
  const actor = userId ? `user:${userId}` : `ip:${getAnonymousActor(request)}`;
  return checkPlatformRateLimit(
    "RESUME_REWRITE_RATE_LIMITER",
    `resume-rewrite:${actor}`,
  );
}
