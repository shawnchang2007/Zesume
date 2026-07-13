export type PayPalLink = {
  href?: string;
  rel?: string;
  method?: string;
};

export type PayPalCapture = {
  id?: string;
  status?: string;
  custom_id?: string;
  amount?: { currency_code?: string; value?: string };
  supplementary_data?: {
    related_ids?: { order_id?: string; capture_id?: string };
  };
};

export type PayPalOrder = {
  id?: string;
  status?: string;
  payer?: { payer_id?: string };
  links?: PayPalLink[];
  purchase_units?: Array<{
    reference_id?: string;
    custom_id?: string;
    amount?: { currency_code?: string; value?: string };
    payments?: { captures?: PayPalCapture[] };
  }>;
};

export type PayPalWebhookEvent = {
  id?: string;
  event_type?: string;
  resource?: PayPalCapture & {
    links?: PayPalLink[];
  };
};

export function amountToCents(value: unknown) {
  if (typeof value !== "string" || !/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  const cents = Number.parseInt(whole, 10) * 100 + Number.parseInt(fraction.padEnd(2, "0"), 10);
  return Number.isSafeInteger(cents) ? cents : null;
}

export function getApprovalUrl(order: PayPalOrder) {
  return order.links?.find((link) => link.rel === "payer-action" || link.rel === "approve")?.href ?? null;
}

export function getCompletedCapture(order: PayPalOrder) {
  return order.purchase_units
    ?.flatMap((unit) => unit.payments?.captures ?? [])
    .find((capture) => capture.status === "COMPLETED") ?? null;
}

export function getWebhookOrderId(event: PayPalWebhookEvent) {
  if (event.event_type === "CHECKOUT.ORDER.APPROVED") return event.resource?.id ?? null;
  return event.resource?.supplementary_data?.related_ids?.order_id ?? null;
}

export function getWebhookCaptureId(event: PayPalWebhookEvent) {
  return event.resource?.supplementary_data?.related_ids?.capture_id
    ?? event.resource?.id
    ?? null;
}

