import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Nav } from "@/components/Nav";

const plans = [
  {
    name: "Free",
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
    price: "Soon",
    note: "Coming soon",
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
    price: "Soon",
    note: "Not in v1",
    features: [
      "100 generations per billing period",
      "Career Experience memory",
      "Profile import and generation",
      "Up to 20 saved history entries",
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="shell">
      <Nav />
      <section className="section">
        <div className="eyebrow">Pricing</div>
        <h1 className="section-title">Start focused. Upgrade when you need depth.</h1>
        <p className="section-copy">
          Every plan keeps factual accuracy first. Paid plan checkout is coming
          soon; server-side access rules and usage tracking are already in place.
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
