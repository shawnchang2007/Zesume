"use client";

import { useState } from "react";
import { CreditCard, LoaderCircle } from "lucide-react";
import type { PurchasablePlan } from "@/lib/paypal/config";

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
        window.location.assign(payload.signInUrl);
        return;
      }
      if (!response.ok || !payload.data?.approvalUrl) {
        throw new Error(payload.error?.message || "Checkout could not be started.");
      }
      window.location.assign(payload.data.approvalUrl);
    } catch (cause) {
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

