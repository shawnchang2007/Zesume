import { NextResponse } from "next/server";
import { requestEmailLoginCode } from "@/lib/auth/email-code";
import { normalizeEmail } from "@/lib/auth/email-code-core";
import { checkAuthEmailRateLimit } from "@/lib/platform/rate-limit";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 2_048;

export async function POST(request: Request) {
  if (!(await checkAuthEmailRateLimit(request, "request"))) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests. Please wait a minute and try again." } },
      { status: 429 },
    );
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_REQUEST_BYTES) {
    return NextResponse.json(
      { error: { code: "REQUEST_TOO_LARGE", message: "The request is too large." } },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    const requestText = await request.text();
    if (requestText.length > MAX_REQUEST_BYTES) {
      return NextResponse.json(
        { error: { code: "REQUEST_TOO_LARGE", message: "The request is too large." } },
        { status: 413 },
      );
    }
    body = JSON.parse(requestText);
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "Enter a valid email address." } },
      { status: 400 },
    );
  }

  const email = normalizeEmail(
    typeof body === "object" && body !== null && "email" in body
      ? (body as { email?: unknown }).email
      : undefined,
  );
  if (!email) {
    return NextResponse.json(
      { error: { code: "INVALID_EMAIL", message: "Enter a valid email address." } },
      { status: 400 },
    );
  }

  try {
    const result = await requestEmailLoginCode(email);
    if (!result.ok) {
      return NextResponse.json(
        {
          error: {
            code: result.code,
            message: `Please wait ${result.retryAfterSeconds} seconds before requesting another code.`,
          },
          retryAfterSeconds: result.retryAfterSeconds,
        },
        {
          status: 429,
          headers: { "Retry-After": String(result.retryAfterSeconds) },
        },
      );
    }

    return NextResponse.json({ ok: true, retryAfterSeconds: result.retryAfterSeconds });
  } catch (error) {
    const code = error instanceof Error ? error.message : "EMAIL_CODE_REQUEST_FAILED";
    console.error("Email login code request failed", { code });

    const configurationError =
      code.includes("NOT_CONFIGURED") || code.startsWith("EMAIL_DELIVERY_FAILED_");
    return NextResponse.json(
      {
        error: {
          code: configurationError ? "EMAIL_SERVICE_UNAVAILABLE" : "EMAIL_CODE_REQUEST_FAILED",
          message: "We could not send a sign-in code right now. Please try again shortly.",
        },
      },
      { status: 503 },
    );
  }
}
