import type { TargetTemplate } from "@/lib/ai/types";
import { getUserCareerItems } from "./career-items";
import { getUserPreferences } from "./preferences";
import { getUserProfile } from "./profile";
import type { MemoryRetrievalInput, RelevantExperienceMemory } from "./types";

const templateKeywords: Record<TargetTemplate, string[]> = {
  software_engineering: [
    "software",
    "engineering",
    "frontend",
    "backend",
    "full-stack",
    "react",
    "next",
    "typescript",
    "python",
    "api",
    "deployment",
    "project",
  ],
  quant: [
    "quant",
    "trading",
    "research",
    "statistics",
    "probability",
    "model",
    "backtest",
    "python",
    "c++",
    "pandas",
    "numpy",
    "finance",
  ],
  finance: [
    "finance",
    "spring",
    "banking",
    "consulting",
    "leadership",
    "teamwork",
    "communication",
    "society",
    "commercial",
    "investment",
  ],
  general: [
    "project",
    "experience",
    "leadership",
    "teamwork",
    "research",
    "analysis",
    "communication",
    "internship",
  ],
};

function scoreExperience(
  experience: Awaited<ReturnType<typeof getUserCareerItems>>[number],
  resumeText: string,
  targetTemplate: TargetTemplate,
) {
  const haystack = [
    resumeText,
    experience.title,
    experience.organization,
    experience.type,
    experience.summary,
    experience.rawContent,
    experience.tags.map(({ tag }) => tag.name).join(" "),
    experience.skills.map(({ skill }) => skill.name).join(" "),
    experience.bullets.map((bullet) => bullet.content).join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return templateKeywords[targetTemplate].reduce(
    (score, keyword) => score + (haystack.includes(keyword) ? 1 : 0),
    0,
  );
}

export async function getMemoryForRewrite({
  userId,
  resumeText,
  targetTemplate,
}: MemoryRetrievalInput) {
  const [profile, preferences, careerItems] = await Promise.all([
    getUserProfile(userId),
    getUserPreferences(userId),
    getUserCareerItems(userId),
  ]);

  const relevantExperiences: RelevantExperienceMemory[] = careerItems
    .map((experience) => ({
      experience,
      score: scoreExperience(experience, resumeText, targetTemplate),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ experience }) => ({
      id: experience.id,
      title: experience.title,
      organization: experience.organization,
      category: experience.type,
      description: experience.summary ?? experience.rawContent,
      tags: [
        ...experience.tags.map(({ tag }) => tag.name),
        ...experience.skills.map(({ skill }) => skill.name),
      ],
      bullets: experience.bullets.map((bullet) => ({
        content: bullet.content,
        tags: [],
      })),
    }));

  return {
    profile,
    preferences,
    relevantExperiences,
  };
}
