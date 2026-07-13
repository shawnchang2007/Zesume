import { NextResponse } from "next/server";
import {
  processPayPalWebhook,
  verifyPayPalWebhook,
} from "@/lib/paypal/service";
import type { PayPalWebhookEvent } from "@/lib/paypal/types";

const MAX_WEBHOOK_BYTES = 256 * 1024;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ success: false }, { status: 413 });
  }

  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_WEBHOOK_BYTES) {
      return NextResponse.json({ success: false }, { status: 413 });
    }
    const event = JSON.parse(rawBody) as PayPalWebhookEvent;
    if (!await verifyPayPalWebhook(request, event)) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const result = await processPayPalWebhook(event);
    return NextResponse.json({ success: true, duplicate: result.duplicate });
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "WEBHOOK_FAILED";
    console.error(JSON.stringify({ event: "paypal_webhook_failed", code }));
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

