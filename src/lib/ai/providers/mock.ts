import type { RewriteResumeInput, RewriteResumeOutput } from "../types";
import { renderStructuredResume } from "@/lib/resume/structured";

const templateLabels = {
  software_engineering: "Software Engineering",
  quant: "Quant",
  finance: "Finance / Spring Week",
  general: "General Internship",
};

const templateBullets = {
  software_engineering: [
    "Built and iterated software projects with clear implementation details, practical tooling, and maintainable structure.",
    "Translated academic and project experience into action-oriented bullets for software engineering applications.",
  ],
  quant: [
    "Reframed analytical, programming, and research experience around quantitative reasoning and evidence-based problem solving.",
    "Highlighted Python, statistics, data analysis, and model-oriented work where those facts were present in the original resume.",
  ],
  finance: [
    "Repositioned leadership, teamwork, communication, and initiative for early-career finance applications.",
    "Reduced excessive technical detail and emphasized responsibility, collaboration, and commercial awareness.",
  ],
  general: [
    "Reframed the strongest experience around transferable problem-solving, collaboration, and ownership.",
    "Balanced projects, activities, and skills for broad internship applications.",
  ],
};

export async function rewriteWithMock(
  input: RewriteResumeInput,
): Promise<RewriteResumeOutput> {
  await new Promise((resolve) => setTimeout(resolve, 700));

  const structuredResume = {
    header: {
      name: "Your Name",
      location: "",
      email: "",
      phone: "",
      links: [],
    },
    sections: input.templateSpec.sectionOrder.map((title) => ({
      title,
      items: [
        {
          name: title.toLowerCase().includes("project")
            ? "Relevant Project"
            : "Selected Entry",
          role: "",
          organization: "",
          date: "",
          location: "",
          meta: "",
          details: title.toLowerCase().includes("skill")
            ? ["Group only the skills already present in the source resume."]
            : [],
          bullets: title.toLowerCase().includes("project")
            ? templateBullets[input.targetTrack]
            : [
                `Reframed source material for ${templateLabels[input.targetTrack]} applications while preserving the original facts.`,
              ],
        },
      ],
    })),
    qualityNotes: {
      majorChangesMade: [
        `Applied the ${input.templateSpec.name} section order and bullet style.`,
      ],
      missingInformation: [
        "Add measurable impact where possible, but only when the metric is real.",
      ],
      warnings: [],
    },
  };

  return {
    structuredResume,
    rewrittenResume: renderStructuredResume(structuredResume),
    suggestions: structuredResume.qualityNotes.missingInformation,
    qualityWarnings: [],
    provider: "mock",
    model: process.env.AI_MODEL || "mock-resume-rewriter",
  };
}
