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
              AI resume rewriting for Gen Z applicants. Import your resume,
              choose a career direction and structure, then export a tailored
              version for SWE, Quant, Finance, or general applications.
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
              <span className="counter">DeepSeek · fact-safe output</span>
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
          Paste or upload a resume, choose the target and structure, then review
          and export the result. Signed-in users can manage their profile and
          generation access without allowing AI to invent achievements.
        </p>
        <div className="feature-grid">
          <article className="feature">
            <h3>
              <CheckCircle2 size={18} aria-hidden="true" /> Two-layer templates
            </h3>
            <p>
              Combine a career target with an ATS, project-heavy, research,
              finance, student, or uploaded custom structure.
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
              <CheckCircle2 size={18} aria-hidden="true" /> Fact-safe memory
            </h3>
            <p>
              The current resume remains primary. Profile and Career Memory can
              support a rewrite without inventing facts or hidden metrics.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
