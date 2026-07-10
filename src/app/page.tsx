import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Nav } from "@/components/Nav";

export default function Home() {
  return (
    <main className="shell">
      <Nav />
      <section className="hero">
        <div className="hero-grid">
          <div>
            <div className="eyebrow">
              <Sparkles size={16} aria-hidden="true" />
              Gen Z Resume Rewriter
            </div>
            <h1>Zesume</h1>
            <p className="hero-copy">
              AI resume rewriting for Gen Z applicants. Paste your resume,
              choose a career direction, and get a tailored version for SWE,
              Quant, or Finance applications.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/app">
                Rewrite My Resume
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link className="button button-secondary" href="/pricing">
                View Plans
              </Link>
            </div>
          </div>
          <div className="product-preview" aria-label="Zesume product preview">
            <div className="preview-toolbar">
              <div className="dots" aria-hidden="true">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
              <span className="counter">mock provider</span>
            </div>
            <div className="preview-body">
              <div className="mini-panel">
                <div className="mini-title">Resume Input</div>
                <div className="line medium" />
                <div className="line" />
                <div className="line short" />
                <div className="tag-row">
                  <span className="tag">SWE</span>
                  <span className="tag">Quant</span>
                  <span className="tag">Finance</span>
                </div>
                <div className="line medium" />
                <div className="line short" />
              </div>
              <div className="mini-panel">
                <div className="mini-title">Generated Output</div>
                <div className="line" />
                <div className="line medium" />
                <div className="line short" />
                <div className="tag-row">
                  <span className="tag">Copy</span>
                  <span className="tag">Regenerate</span>
                </div>
                <div className="line medium" />
                <div className="line" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Turn one resume into career-ready versions.</h2>
        <p className="section-copy">
          Zesume v1 keeps the workflow tight: paste text, choose the target,
          pick a tone, and copy the rewritten result. No uploads, no dashboards,
          no fictional achievements.
        </p>
        <div className="feature-grid">
          <article className="feature">
            <h3>
              <CheckCircle2 size={18} aria-hidden="true" /> Career templates
            </h3>
            <p>
              Rewrite toward Software Engineering, Quant, or Finance / Spring
              Week applications with different emphasis rules.
            </p>
          </article>
          <article className="feature">
            <h3>
              <CheckCircle2 size={18} aria-hidden="true" /> Tone controls
            </h3>
            <p>
              Switch between Professional, Concise, and Technical output without
              changing the facts in the original resume.
            </p>
          </article>
          <article className="feature">
            <h3>
              <CheckCircle2 size={18} aria-hidden="true" /> Rewrite only
            </h3>
            <p>
              The product rule is simple: preserve the user&apos;s facts and put
              missing details into suggestions instead of inventing them.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
