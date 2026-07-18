"use client";

import { useState } from "react";
import { CreditCard, LoaderCircle } from "lucide-react";
import type { PurchasablePlan } from "@/lib/paypal/config";
import { trackEvent } from "@/lib/analytics/client";

const planValues: Record<PurchasablePlan, number> = {
  PLUS: 5,
  PRO: 10,
};

type CheckoutResponse = {
  success?: boolean;
  data?: { approvalUrl?: string };
  error?: { message?: string };
  signInUrl?: string;
};

export function PayPalPurchaseButton({
  plan,
  label,
  disabled = false,
}: {
  plan: PurchasablePlan;
  label: string;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    const value = planValues[plan];
    trackEvent("begin_checkout", {
      currency: "USD",
      value,
      plan,
      items: [
        {
          item_id: plan.toLowerCase(),
          item_name: `Zesume ${plan === "PLUS" ? "Plus" : "Pro"}`,
          price: value,
          quantity: 1,
        },
      ],
    });
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/billing/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const payload = await response.json().catch(() => ({})) as CheckoutResponse;
      if (response.status === 401 && payload.signInUrl) {
        trackEvent("checkout_signin_required", { plan, value });
        window.location.assign(payload.signInUrl);
        return;
      }
      if (!response.ok || !payload.data?.approvalUrl) {
        throw new Error(payload.error?.message || "Checkout could not be started.");
      }
      trackEvent("checkout_redirected", {
        provider: "paypal",
        plan,
        value,
        currency: "USD",
      });
      window.location.assign(payload.data.approvalUrl);
    } catch (cause) {
      trackEvent("checkout_failed", {
        provider: "paypal",
        plan,
        value,
        currency: "USD",
        error_code: "CREATE_ORDER_FAILED",
      });
      setError(cause instanceof Error ? cause.message : "Checkout could not be started.");
      setLoading(false);
    }
  }

  return (
    <div className="pricing-purchase">
      <button
        className="button button-gold pricing-card-button"
        disabled={disabled || loading}
        onClick={startCheckout}
        type="button"
      >
        {loading ? <LoaderCircle className="spin" size={16} /> : <CreditCard size={16} />}
        {loading ? "Opening PayPal..." : label}
      </button>
      {error ? <p className="pricing-error" role="alert">{error}</p> : null}
    </div>
  );
}
