import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { BodyTooLargeError, readJsonRequest } from "@/lib/http/body";
import { getApplicationBaseUrl, parsePurchasablePlan } from "@/lib/paypal/config";
import { CheckoutError, createPayPalCheckout } from "@/lib/paypal/service";

const MAX_BODY_BYTES = 2 * 1024;

export async function POST(request: Request) {
  const currentUser = await getCurrentUser(request);
  if (!currentUser?.id) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "AUTH_REQUIRED", message: "Sign in before purchasing a plan." },
        signInUrl: "/sign-in?callbackUrl=%2Fpricing",
      },
      { status: 401 },
    );
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: { code: "BILLING_UNAVAILABLE", message: "Billing is temporarily unavailable." } },
      { status: 503 },
    );
  }

  try {
    const baseUrl = getApplicationBaseUrl(request);
    const origin = request.headers.get("origin");
    const requestOrigin = new URL(request.url).origin;
    if (origin && origin !== baseUrl && origin !== requestOrigin) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_ORIGIN", message: "Checkout must start from Zesume." } },
        { status: 403 },
      );
    }

    const body = await readJsonRequest<{ plan?: unknown }>(request, MAX_BODY_BYTES);
    const plan = parsePurchasablePlan(body.plan);
    if (!plan) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_PLAN", message: "Choose Plus or Pro." } },
        { status: 400 },
      );
    }

    const checkout = await createPayPalCheckout(currentUser.id, plan, baseUrl);
    return NextResponse.json({ success: true, data: checkout });
  } catch (error) {
    const status = error instanceof BodyTooLargeError
      ? 413
      : error instanceof CheckoutError
        ? error.status
        : 502;
    const code = error instanceof BodyTooLargeError
      ? "REQUEST_TOO_LARGE"
      : error instanceof CheckoutError
        ? error.code
        : error instanceof Error && error.message === "PAYPAL_NOT_CONFIGURED"
          ? "PAYPAL_NOT_CONFIGURED"
          : "CHECKOUT_FAILED";
    console.error(JSON.stringify({ event: "paypal_checkout_create_failed", code }));
    return NextResponse.json(
      {
        success: false,
        error: {
          code,
          message: error instanceof CheckoutError
            ? error.message
            : code === "PAYPAL_NOT_CONFIGURED"
              ? "PayPal Sandbox is not configured yet."
              : "PayPal checkout could not be started. Please try again.",
        },
      },
      { status },
    );
  }
}

