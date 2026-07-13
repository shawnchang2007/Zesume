import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getApplicationBaseUrl } from "@/lib/paypal/config";
import { CheckoutError, capturePayPalOrder } from "@/lib/paypal/service";

export async function GET(request: Request) {
  const baseUrl = getApplicationBaseUrl(request);
  const url = new URL(request.url);
  const orderId = url.searchParams.get("token")?.trim();
  const currentUser = await getCurrentUser(request);

  if (!currentUser?.id) {
    return NextResponse.redirect(`${baseUrl}/sign-in?callbackUrl=${encodeURIComponent("/pricing?payment=signin")}`);
  }
  if (!orderId || !/^[A-Z0-9-]{5,64}$/i.test(orderId)) {
    return NextResponse.redirect(`${baseUrl}/pricing?payment=invalid`);
  }

  try {
    const payment = await capturePayPalOrder(orderId, currentUser.id);
    return NextResponse.redirect(
      `${baseUrl}/dashboard?payment=success&plan=${payment.plan.toLowerCase()}`,
    );
  } catch (error) {
    const code = error instanceof CheckoutError ? error.code : "CAPTURE_FAILED";
    console.error(JSON.stringify({ event: "paypal_capture_failed", code }));
    return NextResponse.redirect(`${baseUrl}/pricing?payment=failed`);
  }
}

