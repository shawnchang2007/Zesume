import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

const externalResources = [
  {
    href: "https://careerservices.fas.harvard.edu/channels/create-a-resume-cv-or-cover-letter/",
    label: "Harvard resume guide",
  },
  {
    href: "https://www.imperial.ac.uk/careers/applications-and-interviews/cv/",
    label: "Imperial CV guidance",
  },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand">
          <Link className="brand" href="/">
            <BrandMark />
            <span>Zesume</span>
          </Link>
          <p>Fact-safe AI resume rewriting for students and early-career applicants.</p>
        </div>
        <nav className="footer-links" aria-label="Product links">
          <strong>Product</strong>
          <Link href="/app">Resume Rewriter</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/resources">Resume Resources</Link>
        </nav>
        <nav className="footer-links" aria-label="External resume resources">
          <strong>Trusted guidance</strong>
          {externalResources.map((resource) => (
            <a
              href={resource.href}
              key={resource.href}
              rel="noopener noreferrer"
              target="_blank"
            >
              {resource.label}
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          ))}
        </nav>
      </div>
      <div className="site-footer-meta">
        <span>© 2026 Zesume</span>
        <span>Resume facts remain yours. AI should not invent them.</span>
      </div>
    </footer>
  );
}
