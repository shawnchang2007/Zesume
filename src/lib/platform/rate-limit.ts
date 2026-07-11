import { getCloudflareContext } from "@opennextjs/cloudflare";

type RateLimiter = {
  limit(input: { key: string }): Promise<{ success: boolean }>;
};

type RateLimitEnvironment = {
  RESUME_REWRITE_RATE_LIMITER?: RateLimiter;
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

export async function checkResumeRewriteRateLimit(
  request: Request,
  userId?: string,
) {
  try {
    const { env } = getCloudflareContext();
    const limiter = (env as RateLimitEnvironment).RESUME_REWRITE_RATE_LIMITER;

    // Local Next.js development has no Cloudflare binding, so it remains usable.
    if (!limiter) {
      return true;
    }

    const actor = userId ? `user:${userId}` : `ip:${getAnonymousActor(request)}`;
    const key = await hashActor(`resume-rewrite:${actor}`);
    const result = await limiter.limit({ key });

    return result.success;
  } catch {
    // Availability takes priority if the platform limiter is temporarily unavailable.
    return true;
  }
}
