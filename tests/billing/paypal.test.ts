import { describe, expect, it } from "vitest";

import {
  formatUsd,
  parsePurchasablePlan,
  PAYPAL_PRODUCTS,
} from "@/lib/paypal/config";
import {
  amountToCents,
  getApprovalUrl,
  getCompletedCapture,
  getWebhookOrderId,
} from "@/lib/paypal/types";

describe("PayPal one-time checkout", () => {
  it("keeps paid plan prices on the server", () => {
    expect(PAYPAL_PRODUCTS.PLUS.amountCents).toBe(500);
    expect(PAYPAL_PRODUCTS.PRO.amountCents).toBe(1_000);
    expect(formatUsd(PAYPAL_PRODUCTS.PLUS.amountCents)).toBe("5.00");
    expect(formatUsd(PAYPAL_PRODUCTS.PRO.amountCents)).toBe("10.00");
  });

  it("accepts only Plus and Pro purchases", () => {
    expect(parsePurchasablePlan("PLUS")).toBe("PLUS");
    expect(parsePurchasablePlan("PRO")).toBe("PRO");
    expect(parsePurchasablePlan("FREE")).toBeNull();
    expect(parsePurchasablePlan({ plan: "PRO" })).toBeNull();
  });

  it("parses PayPal amounts without floating point rounding", () => {
    expect(amountToCents("5.00")).toBe(500);
    expect(amountToCents("10")).toBe(1_000);
    expect(amountToCents("5.001")).toBeNull();
    expect(amountToCents("not-money")).toBeNull();
  });

  it("extracts approval, capture, and webhook order identifiers", () => {
    const order = {
      links: [{ rel: "payer-action", href: "https://sandbox.paypal.test/approve" }],
      purchase_units: [{ payments: { captures: [{ id: "CAPTURE", status: "COMPLETED" }] } }],
    };
    expect(getApprovalUrl(order)).toBe("https://sandbox.paypal.test/approve");
    expect(getCompletedCapture(order)?.id).toBe("CAPTURE");
    expect(getWebhookOrderId({
      event_type: "PAYMENT.CAPTURE.COMPLETED",
      resource: { supplementary_data: { related_ids: { order_id: "ORDER" } } },
    })).toBe("ORDER");
  });
});
