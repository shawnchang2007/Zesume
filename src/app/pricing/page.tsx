import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { PayPalPurchaseButton } from "@/components/billing/PayPalPurchaseButton";
import { AnalyticsEvent } from "@/components/analytics/AnalyticsEvent";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCurrentAccess } from "@/lib/billing";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Compare Zesume Free, Plus, and Pro access for AI resume rewriting, custom templates, Career Memory, and saved history.",
  alternates: { canonical: "/pricing" },
  openGraph: { title: "Zesume Pricing", url: "/pricing" },
};

const plans = [
  {
    name: "Free",
    plan: "FREE" as const,
    price: "$0",
    note: "For signed-in students",
    features: [
      "3 generations per billing period",
      "All built-in career and resume templates",
      "Basic profile memory",
      "Up to 3 saved history entries",
    ],
  },
  {
    name: "Plus",
    plan: "PLUS" as const,
    price: "$5",
    note: "One payment · 30 days",
    features: [
      "50 generations per billing period",
      "Custom template analysis",
      "Up to 10 saved history entries",
      "Upload your own template per session",
    ],
    highlight: true,
  },
  {
    name: "Pro",
    plan: "PRO" as const,
    price: "$10",
    note: "One payment · 30 days",
    features: [
      "100 generations per billing period",
      "Career Experience memory",
      "Resume-to-Memory import with review",
      "Profile import and generation",
      "Up to 20 saved history entries",
    ],
  },
];

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const [params, currentUser] = await Promise.all([searchParams, getCurrentUser()]);
  const access = await getCurrentAccess(currentUser, { includeUsage: false });
  const checkoutResult = ["cancelled", "failed", "invalid", "signin"].includes(
    params.payment ?? "",
  )
    ? params.payment
    : undefined;

  return (
    <main className="shell">
      <Nav />
      <AnalyticsEvent
        name="pricing_viewed"
        parameters={{
          authenticated: Boolean(currentUser),
          current_plan: access.plan,
        }}
      />
      {checkoutResult ? (
        <AnalyticsEvent
          name="checkout_result"
          parameters={{ result: checkoutResult }}
          sessionStorageKey={`zesume-checkout-result-${checkoutResult}`}
        />
      ) : null}
      <section className="section">
        <div className="eyebrow">Pricing</div>
        <h1 className="section-title">Start focused. Upgrade when you need depth.</h1>
        <p className="section-copy">
          Pay once for 30 days of access. There is no automatic renewal, and every
          plan keeps factual accuracy first.
        </p>
        {params.payment === "cancelled" ? (
          <div className="pricing-status neutral"><XCircle size={18} />Payment cancelled. Nothing was charged.</div>
        ) : null}
        {params.payment === "failed" || params.payment === "invalid" ? (
          <div className="pricing-status error"><XCircle size={18} />We could not confirm the payment. No access was added.</div>
        ) : null}
        {params.payment === "signin" ? (
          <div className="pricing-status neutral"><CheckCircle2 size={18} />Sign in, then choose your plan again.</div>
        ) : null}
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article
              className={`price-card ${plan.highlight ? "highlight" : ""} ${plan.plan !== "FREE" ? "paid" : ""}`}
              key={plan.name}
            >
              <h2>{plan.name}</h2>
              <div className="price">{plan.price}</div>
              <p className="counter">{plan.note}</p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              {plan.plan === "FREE" ? (
                <Link className="button button-secondary pricing-card-button" href="/app">
                  Open Resume Studio <ArrowRight size={16} />
                </Link>
              ) : (
                <PayPalPurchaseButton
                  disabled={plan.plan === "PLUS" && access.plan === "PRO"}
                  label={
                    plan.plan === "PLUS" && access.plan === "PRO"
                      ? "Pro is already active"
                      : access.plan === plan.plan
                        ? `Extend ${plan.name} by 30 days`
                        : `Buy ${plan.name} with PayPal`
                  }
                  plan={plan.plan}
                />
              )}
            </article>
          ))}
        </div>
        <p style={{ marginTop: 24 }}>
          <Link className="button button-primary" href={currentUser ? "/dashboard" : "/sign-in?callbackUrl=%2Fpricing"}>
            {currentUser ? "View account usage" : "Sign in before checkout"}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </p>
      </section>
      <Footer />
    </main>
  );
}
