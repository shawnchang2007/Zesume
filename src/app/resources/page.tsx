import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  ExternalLink,
  GraduationCap,
  ListChecks,
  UserRoundSearch,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Resume Resources for Students",
  description:
    "Evidence-based resume, CV, cover letter, and LinkedIn guidance for university students and early-career applicants.",
  alternates: { canonical: "/resources" },
  openGraph: {
    title: "Resume Resources for Students | Zesume",
    description:
      "Trusted resume and CV guidance from university career services and professional platforms.",
    url: "/resources",
  },
};

const resources = [
  {
    description:
      "A practical overview of resume, CV, and cover-letter fundamentals for university applicants.",
    href: "https://careerservices.fas.harvard.edu/channels/create-a-resume-cv-or-cover-letter/",
    icon: GraduationCap,
    source: "Harvard FAS",
    title: "Create a resume, CV, or cover letter",
  },
  {
    description:
      "UK-focused guidance on structure, evidence, tailoring, readability, and ATS considerations.",
    href: "https://www.imperial.ac.uk/careers/applications-and-interviews/cv/",
    icon: BookOpenCheck,
    source: "Imperial College London",
    title: "CVs and resumes",
  },
  {
    description:
      "Clear advice on CV length, sections, active language, formatting, honesty, and file types.",
    href: "https://www.prospects.ac.uk/careers-advice/cvs-and-cover-letters/how-to-write-a-cv/",
    icon: ListChecks,
    source: "Prospects",
    title: "How to write a CV",
  },
  {
    description:
      "Official recommendations for presenting experience, skills, education, and professional identity online.",
    href: "https://www.linkedin.com/help/linkedin/answer/a554351/how-do-i-create-a-good-linkedin-profile-?lang=en",
    icon: UserRoundSearch,
    source: "LinkedIn Help",
    title: "Create a strong LinkedIn profile",
  },
];

export default function ResourcesPage() {
  return (
    <main className="shell">
      <Nav />
      <section className="resource-hero">
        <p className="eyebrow">Resume resource library</p>
        <h1>Use AI with evidence, not guesswork.</h1>
        <p>
          Zesume helps with rewriting and structure. These independent resources
          explain what recruiters and university career teams expect, so you can
          review every generated version with a stronger standard.
        </p>
      </section>

      <section className="resource-section" aria-labelledby="trusted-guidance">
        <div className="resource-section-heading">
          <div>
            <p className="eyebrow">External guidance</p>
            <h2 id="trusted-guidance">Trusted sources worth keeping open</h2>
          </div>
          <span>Links open on the original publisher&apos;s website.</span>
        </div>
        <div className="resource-grid">
          {resources.map((resource) => {
            const Icon = resource.icon;
            return (
              <article className="resource-card" key={resource.href}>
                <span className="resource-icon" aria-hidden="true">
                  <Icon size={20} />
                </span>
                <p className="resource-source">{resource.source}</p>
                <h3>{resource.title}</h3>
                <p>{resource.description}</p>
                <a
                  className="resource-link"
                  href={resource.href}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Read the original guide
                  <ExternalLink size={15} aria-hidden="true" />
                </a>
              </article>
            );
          })}
        </div>
      </section>

      <section className="resource-workflow" aria-labelledby="resource-workflow-title">
        <div>
          <p className="eyebrow">Practical workflow</p>
          <h2 id="resource-workflow-title">Turn guidance into a stronger draft</h2>
        </div>
        <ol>
          <li><strong>Check the role.</strong> Identify the skills and evidence the employer asks for.</li>
          <li><strong>Rewrite with Zesume.</strong> Choose the career target and resume structure that fit the application.</li>
          <li><strong>Verify every fact.</strong> Remove unsupported claims and add missing evidence yourself.</li>
        </ol>
        <Link className="button button-primary" href="/app">
          Open Resume Studio
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>
      <Footer />
    </main>
  );
}
