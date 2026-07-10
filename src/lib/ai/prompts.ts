import type {
  RelevantExperienceMemory,
  ResumeMemoryContext,
  RewriteResumeInput,
  TargetTemplate,
  Tone,
} from "./types";

type TemplateRuleSet = {
  title: string;
  targetUser: string;
  emphasis: string[];
  bulletStructure: string[];
  actionVerbs: string[];
  forbidden: string[];
};

const templateRules: Record<TargetTemplate, TemplateRuleSet> = {
  software_engineering: {
    title: "Software Engineering Internship Resume",
    targetUser:
      "Students and early-career applicants applying for software engineering, frontend, backend, full-stack, platform, or developer internships.",
    emphasis: [
      "programming languages and frameworks that appear in the original resume",
      "technical implementation details",
      "software projects, shipped features, debugging, testing, deployment, and collaboration",
      "engineering problem-solving and maintainability",
    ],
    bulletStructure: [
      "Action verb + technical work performed + specific stack/method + result or scope if provided",
      "Prefer implementation clarity over hype",
      "Mention technologies only when they appear in the original resume",
    ],
    actionVerbs: [
      "Built",
      "Implemented",
      "Developed",
      "Designed",
      "Integrated",
      "Debugged",
      "Automated",
      "Deployed",
      "Refactored",
      "Collaborated",
    ],
    forbidden: [
      "Do not invent programming languages, frameworks, cloud tools, users, latency gains, or production impact",
      "Do not turn coursework into employment",
      "Do not imply ownership of full systems unless the original resume supports it",
    ],
  },
  quant: {
    title: "Quant / Trading / Research Resume",
    targetUser:
      "Students and early-career applicants applying for quant research, trading, data, risk, or quantitative finance internships.",
    emphasis: [
      "mathematics, probability, statistics, and quantitative reasoning",
      "Python, C++, pandas, NumPy, data analysis, backtesting, and modeling only if provided",
      "research process, assumptions, datasets, and evaluation methods",
      "financial market understanding where the resume actually mentions it",
    ],
    bulletStructure: [
      "Action verb + analytical method/model + data/tooling + finding or metric if provided",
      "If Sharpe, IC, drawdown, return, or accuracy is missing, suggest adding it instead of inventing it",
      "Use precise language and avoid broad claims",
    ],
    actionVerbs: [
      "Analyzed",
      "Modeled",
      "Backtested",
      "Researched",
      "Evaluated",
      "Calculated",
      "Simulated",
      "Optimized",
      "Validated",
      "Interpreted",
    ],
    forbidden: [
      "Do not invent Sharpe ratios, returns, IC, drawdowns, rankings, or trading performance",
      "Do not claim market expertise beyond the source text",
      "Do not add datasets, libraries, or asset classes that are not present in the original resume",
    ],
  },
  finance: {
    title: "Finance / Spring Week Resume",
    targetUser:
      "Students applying for investment banking, consulting, finance insight days, spring weeks, and early-career business roles.",
    emphasis: [
      "leadership, teamwork, communication, initiative, and responsibility",
      "commercial awareness and academic excellence when present",
      "extracurricular activities, societies, competitions, and client-facing communication",
      "clear business impact without excessive technical detail",
    ],
    bulletStructure: [
      "Action verb + responsibility + stakeholder/team context + result if provided",
      "Keep bullets formal, concise, and suitable for finance applications",
      "Translate technical projects into business-relevant ownership only when truthful",
    ],
    actionVerbs: [
      "Led",
      "Coordinated",
      "Presented",
      "Managed",
      "Supported",
      "Organized",
      "Researched",
      "Communicated",
      "Delivered",
      "Collaborated",
    ],
    forbidden: [
      "Do not invent internships, firms, clients, deal exposure, awards, GPA, or rankings",
      "Do not overstate leadership scope",
      "Do not use technical jargon unless it directly supports the finance narrative",
    ],
  },
};

const tonePrompts: Record<Tone, string> = {
  professional: "Tone: professional, polished, and suitable for internship applications.",
  concise: "Tone: concise and direct. Keep bullet points short and avoid unnecessary wording.",
  technical: "Tone: more technical. Emphasize tools, implementation details, and technical problem-solving without adding new facts.",
};

function formatList(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function formatTemplateRules(rules: TemplateRuleSet) {
  return `Target template: ${rules.title}

Target user:
${rules.targetUser}

Emphasis:
${formatList(rules.emphasis)}

Bullet point writing structure:
${formatList(rules.bulletStructure)}

Recommended action verbs:
${rules.actionVerbs.join(", ")}

Template-specific forbidden items:
${formatList(rules.forbidden)}`;
}

function hasMemory(memory?: ResumeMemoryContext) {
  return Boolean(
    memory?.profile ||
      memory?.preferences ||
      (memory?.relevantExperiences && memory.relevantExperiences.length > 0),
  );
}

function formatExperienceMemory(experience: RelevantExperienceMemory) {
  const bullets = experience.bullets
    .slice(0, 4)
    .map((bullet) => `  - ${bullet.content}`)
    .join("\n");

  return `- ${experience.title}${experience.organization ? ` at ${experience.organization}` : ""}
  Category: ${experience.category}
  Tags: ${experience.tags.join(", ") || "none"}
${experience.description ? `  Notes: ${experience.description}\n` : ""}${bullets}`;
}

function formatMemoryContext(memory?: ResumeMemoryContext) {
  if (!hasMemory(memory)) {
    return "";
  }

  const profile = memory?.profile;
  const preferences = memory?.preferences;
  const experiences = memory?.relevantExperiences ?? [];

  return `Supporting memory context:
This memory is database-stored user context. It is NOT the primary source.
Use it only when it clearly supports the current resume text and selected target.
Do not add memory facts directly unless they are relevant and consistent with the current resume.
If memory suggests useful missing information, mention it in suggestions instead of inserting unsupported claims.

Profile memory:
${profile?.fullName ? `- Name: ${profile.fullName}` : ""}
${profile?.educationSummary ? `- Education summary: ${profile.educationSummary}` : ""}
${profile?.careerStage ? `- Career stage: ${profile.careerStage}` : ""}
${profile?.targetRoles?.length ? `- Target roles: ${profile.targetRoles.join(", ")}` : ""}
${profile?.industries?.length ? `- Industries: ${profile.industries.join(", ")}` : ""}
${profile?.locationPreference ? `- Location preference: ${profile.locationPreference}` : ""}
${profile?.notes ? `- Notes: ${profile.notes}` : ""}

Preference memory:
${preferences?.preferredTone ? `- Preferred tone: ${preferences.preferredTone}` : ""}
${preferences?.preferredBulletStyle ? `- Preferred bullet style: ${preferences.preferredBulletStyle}` : ""}
${preferences?.avoidPhrases?.length ? `- Avoid phrases: ${preferences.avoidPhrases.join(", ")}` : ""}

Relevant experience memory:
${experiences.length ? experiences.map(formatExperienceMemory).join("\n") : "- None selected for this rewrite."}`;
}

export function buildUserPrompt(input: RewriteResumeInput) {
  return `You are a professional resume editor for students and early-career applicants.

Your task is to rewrite the user's resume according to the selected career template.

Core rule:
Rewrite, do not invent.

Universal resume writing rules:
1. Preserve the user's original facts.
2. Start bullet points with strong action verbs where possible.
3. Keep bullet points concise, ideally no more than 25-30 words.
4. Do not use first person, including "I", "we", "my", or "our".
5. Do not add companies, roles, internships, awards, grades, rankings, technologies, metrics, or achievements that the user did not provide.
6. Do not use vague hype terms such as "cutting-edge", "world-class", "revolutionary", "impactful solutions", or "various tasks".
7. Improve clarity, structure, and professional tone without exaggeration.

Fact safety rules:
1. If the original resume has no numbers, do not create specific percentages, money amounts, user counts, rankings, performance gains, or model metrics.
2. If a result or metric is missing, mention it in suggestions instead of inventing it.
3. If a bullet would benefit from a metric but none is provided, keep the bullet factual and add a suggestion asking the user to provide the real metric.
4. If you are uncertain whether a claim is supported, keep the claim conservative and add a quality warning.
5. The current resume text is always the primary source. Memory is supporting context only.
6. Never use memory to invent companies, roles, awards, grades, rankings, technologies, metrics, or achievements not supported by the current rewrite request.

${formatTemplateRules(templateRules[input.targetTemplate])}

${tonePrompts[input.tone]}

${formatMemoryContext(input.memory)}

Return only valid JSON in this exact shape:
{
  "rewrittenResume": "string",
  "suggestions": ["string"],
  "qualityWarnings": ["string"]
}

qualityWarnings should be empty only when the rewritten resume is concise, factual, and does not contain risky claims.

Resume text:
${input.resumeText}`;
}

export function buildRewritePrompt(input: RewriteResumeInput) {
  return buildUserPrompt(input);
}
