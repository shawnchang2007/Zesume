export type ResumeTemplateDensity = "compact" | "balanced" | "detailed";

export type BuiltInResumeTemplateId =
  | "classic-ats"
  | "swe-project-heavy"
  | "quant-research"
  | "finance-spring-week"
  | "one-page-student";

export type ResumeTemplateId =
  | BuiltInResumeTemplateId
  | "uploaded-template";

export type ResumeTemplateSpec = {
  id: ResumeTemplateId;
  name: string;
  description: string;
  bestFor: string[];
  sectionOrder: string[];
  contentRules: string[];
  bulletStyle: string;
  density: ResumeTemplateDensity;
  atsFriendly: boolean;
};

const uploadedTemplateDensities = new Set<ResumeTemplateDensity>([
  "compact",
  "balanced",
  "detailed",
]);

function cleanString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";

  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function cleanStringList(
  value: unknown,
  options: { maxItems: number; maxLength: number },
) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => cleanString(item, options.maxLength))
    .filter(Boolean)
    .slice(0, options.maxItems);
}

export function parseUploadedTemplateSpec(
  value: unknown,
): ResumeTemplateSpec | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  const name = cleanString(candidate.name, 80);
  const description = cleanString(candidate.description, 240);
  const bestFor = cleanStringList(candidate.bestFor, {
    maxItems: 8,
    maxLength: 60,
  });
  const sectionOrder = cleanStringList(candidate.sectionOrder, {
    maxItems: 12,
    maxLength: 80,
  });
  const contentRules = cleanStringList(candidate.contentRules, {
    maxItems: 10,
    maxLength: 240,
  });
  const bulletStyle = cleanString(candidate.bulletStyle, 500);
  const density = candidate.density;

  if (
    !name ||
    !description ||
    bestFor.length === 0 ||
    sectionOrder.length === 0 ||
    contentRules.length === 0 ||
    !bulletStyle ||
    typeof density !== "string" ||
    !uploadedTemplateDensities.has(density as ResumeTemplateDensity) ||
    typeof candidate.atsFriendly !== "boolean"
  ) {
    return null;
  }

  return {
    id: "uploaded-template",
    name,
    description,
    bestFor,
    sectionOrder,
    contentRules,
    bulletStyle,
    density: density as ResumeTemplateDensity,
    atsFriendly: candidate.atsFriendly,
  };
}

export const builtInResumeTemplates: readonly (ResumeTemplateSpec & {
  id: BuiltInResumeTemplateId;
})[] = [
  {
    id: "classic-ats",
    name: "Classic ATS Professional",
    description:
      "A dependable single-column structure with balanced experience and project coverage.",
    bestFor: ["General", "SWE", "Quant", "Finance", "Spring Week"],
    sectionOrder: [
      "Education",
      "Experience",
      "Projects",
      "Technical Skills",
      "Activities / Leadership",
      "Additional Information",
    ],
    contentRules: [
      "Use a clean single-column structure and omit empty sections.",
      "Balance formal experience with relevant projects.",
      "Group technical skills by category when the source supports it.",
      "Keep optional achievements, activities, languages, and interests only when useful.",
    ],
    bulletStyle:
      "Action verb + task or responsibility + tools or method + truthful outcome or scope when provided.",
    density: "balanced",
    atsFriendly: true,
  },
  {
    id: "swe-project-heavy",
    name: "SWE Project-Heavy",
    description:
      "Moves projects and technical skills forward to emphasize implementation and engineering depth.",
    bestFor: ["SWE", "Full Stack", "Backend", "Frontend", "AI Engineering"],
    sectionOrder: [
      "Education",
      "Technical Skills",
      "Projects",
      "Experience",
      "Leadership & Activities",
    ],
    contentRules: [
      "Prioritize substantial software projects over unrelated experience.",
      "Expand architecture, API, database, testing, debugging, and deployment details when present.",
      "Group skills into languages, frontend, backend, databases, cloud, and tools when supported.",
      "Do not add technologies or engineering impact absent from the source.",
    ],
    bulletStyle:
      "Strong engineering verb + system or feature + specific implementation detail + functional result, reliability, or maintainability outcome.",
    density: "detailed",
    atsFriendly: true,
  },
  {
    id: "quant-research",
    name: "Quant Research Compact",
    description:
      "A compact research-led layout highlighting mathematics, programming, models, and validation.",
    bestFor: ["Quant Research", "Quant Trading", "Quant Developer", "Data / Research"],
    sectionOrder: [
      "Education",
      "Technical Skills",
      "Quantitative Projects",
      "Experience",
      "Competitions / Activities",
    ],
    contentRules: [
      "Prioritize relevant mathematics, statistics, programming, and research methods.",
      "Describe datasets, assumptions, models, backtests, and validation only when present.",
      "Mention Sharpe, IC, drawdown, returns, or accuracy only when supplied by the user.",
      "Keep unrelated activities brief or omit them when space is limited.",
    ],
    bulletStyle:
      "Analytical verb + model or research method + data and tooling + verified finding, limitation, or metric when provided.",
    density: "compact",
    atsFriendly: true,
  },
  {
    id: "finance-spring-week",
    name: "Finance Spring Week",
    description:
      "A polished business-focused layout for academics, leadership, commercial awareness, and teamwork.",
    bestFor: ["Spring Week", "Investment Banking", "Asset Management", "Consulting"],
    sectionOrder: [
      "Education",
      "Experience",
      "Leadership & Activities",
      "Projects",
      "Skills & Interests",
    ],
    contentRules: [
      "Emphasize academics, leadership, analysis, communication, and commercial relevance.",
      "Translate technical work into truthful business context without hiding meaningful analytical depth.",
      "Include grades, rankings, awards, clients, or deal exposure only when explicitly provided.",
      "Keep technical jargon only when it supports the target role.",
    ],
    bulletStyle:
      "Business action verb + responsibility or analysis + stakeholder context or method + verified outcome or decision supported.",
    density: "balanced",
    atsFriendly: true,
  },
  {
    id: "one-page-student",
    name: "One-Page Student Internship",
    description:
      "A concise student-first layout that stays substantial without requiring extensive work history.",
    bestFor: ["First-year Students", "Second-year Students", "General Internships"],
    sectionOrder: [
      "Education",
      "Skills",
      "Projects",
      "Experience / Activities",
      "Additional Information",
    ],
    contentRules: [
      "Keep the resume compact enough for a single page.",
      "Prioritize the strongest projects, skills, coursework, and student activities.",
      "Use no more than three focused bullets for most entries.",
      "Omit weak repetition and empty sections rather than adding filler.",
    ],
    bulletStyle:
      "Concise action verb + contribution or feature + relevant method or technology + factual purpose or outcome.",
    density: "compact",
    atsFriendly: true,
  },
] as const;

const builtInTemplateMap = new Map(
  builtInResumeTemplates.map((template) => [template.id, template]),
);

export function isResumeTemplateId(value: string): value is ResumeTemplateId {
  return value === "uploaded-template" || builtInTemplateMap.has(value as BuiltInResumeTemplateId);
}

export function getResumeTemplateSpec(
  templateId: ResumeTemplateId,
  uploadedTemplateSpec?: ResumeTemplateSpec,
) {
  if (templateId === "uploaded-template") {
    return uploadedTemplateSpec?.id === "uploaded-template"
      ? uploadedTemplateSpec
      : null;
  }

  return builtInTemplateMap.get(templateId) ?? null;
}
