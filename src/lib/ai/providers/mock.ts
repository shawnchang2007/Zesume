import type { RewriteResumeInput, RewriteResumeOutput } from "../types";

const templateLabels = {
  software_engineering: "Software Engineering",
  quant: "Quant",
  finance: "Finance / Spring Week",
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
};

export async function rewriteWithMock(
  input: RewriteResumeInput,
): Promise<RewriteResumeOutput> {
  await new Promise((resolve) => setTimeout(resolve, 700));

  return {
    rewrittenResume: `EDUCATION

Your University
- Reframed academic background for ${templateLabels[input.targetTemplate]} applications while preserving the original facts provided.

EXPERIENCE

Selected Experience
- Strengthened resume bullets with concise action verbs and clearer ownership.
- Improved phrasing to match a ${input.tone} tone without adding companies, awards, grades, or metrics.

PROJECTS

Relevant Projects
- ${templateBullets[input.targetTemplate][0]}
- ${templateBullets[input.targetTemplate][1]}

SKILLS

Use this section to group only the skills already present in your resume, such as languages, tools, frameworks, finance concepts, or research methods.`,
    suggestions: [
      "Add measurable impact where possible, but only if the metric is real.",
      "Keep each bullet focused on action, method, and outcome.",
      "Separate skills into clear groups such as languages, frameworks, tools, and domain knowledge.",
    ],
    qualityWarnings: [],
    provider: "mock",
    model: process.env.AI_MODEL || "mock-resume-rewriter",
  };
}
