import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Nav } from "@/components/Nav";

const plans = [
  {
    name: "Free",
    price: "$0",
    note: "For early testing",
    features: [
      "3 generations per day later",
      "Up to 3,000 characters later",
      "3 career templates",
      "No saved history",
    ],
  },
  {
    name: "Starter",
    price: "$5",
    note: "Coming soon",
    features: [
      "100 generations per month",
      "Up to 8,000 characters",
      "Saved history",
      "No watermark",
    ],
    highlight: true,
  },
  {
    name: "Pro",
    price: "Soon",
    note: "Not in v1",
    features: [
      "Advanced templates",
      "More providers",
      "Resume versions",
      "Future export options",
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="shell">
      <Nav />
      <section className="section">
        <div className="eyebrow">Pricing</div>
        <h1 className="section-title">Simple while Zesume is in MVP.</h1>
        <p className="section-copy">
          The first local version is free to test with the mock provider. Payment,
          accounts, history, and usage limits are intentionally left for later.
        </p>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article
              className={`price-card ${plan.highlight ? "highlight" : ""}`}
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
            </article>
          ))}
        </div>
        <p style={{ marginTop: 24 }}>
          <Link className="button button-primary" href="/app">
            Try the rewriter
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </p>
      </section>
    </main>
  );
}
