export type PayPalEnvironment = "sandbox" | "live";
export type PurchasablePlan = "PLUS" | "PRO";

export const PAYPAL_PRODUCTS = {
  PLUS: {
    plan: "PLUS" as const,
    name: "Zesume Plus",
    amountCents: 500,
    currency: "USD",
    accessDays: 30,
  },
  PRO: {
    plan: "PRO" as const,
    name: "Zesume Pro",
    amountCents: 1_000,
    currency: "USD",
    accessDays: 30,
  },
} as const;

export const PAYPAL_WEBHOOK_EVENTS = [
  "CHECKOUT.ORDER.APPROVED",
  "CHECKOUT.PAYMENT-APPROVAL.REVERSED",
  "PAYMENT.CAPTURE.COMPLETED",
  "PAYMENT.CAPTURE.PENDING",
  "PAYMENT.CAPTURE.DECLINED",
  "PAYMENT.CAPTURE.REFUNDED",
  "PAYMENT.CAPTURE.REVERSED",
] as const;

export function parsePurchasablePlan(value: unknown): PurchasablePlan | null {
  return value === "PLUS" || value === "PRO" ? value : null;
}

export function getPayPalEnvironment(): PayPalEnvironment {
  return process.env.PAYPAL_ENVIRONMENT?.toLowerCase() === "live"
    ? "live"
    : "sandbox";
}

export function getPayPalApiBase() {
  return getPayPalEnvironment() === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export function getPayPalCredentials() {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("PAYPAL_NOT_CONFIGURED");
  }

  return { clientId, clientSecret };
}

export function getApplicationBaseUrl(request?: Request) {
  const configured = process.env.AUTH_URL?.trim();
  const candidate = configured || (request ? new URL(request.url).origin : "");

  if (!candidate) throw new Error("APPLICATION_URL_NOT_CONFIGURED");

  const url = new URL(candidate);
  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    throw new Error("APPLICATION_URL_NOT_SECURE");
  }

  return url.origin;
}

export function formatUsd(amountCents: number) {
  return (amountCents / 100).toFixed(2);
}

