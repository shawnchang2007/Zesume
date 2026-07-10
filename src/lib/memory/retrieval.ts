import type { TargetTemplate } from "@/lib/ai/types";
import { getUserExperiences } from "./experiences";
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
};

function scoreExperience(
  experience: Awaited<ReturnType<typeof getUserExperiences>>[number],
  resumeText: string,
  targetTemplate: TargetTemplate,
) {
  const haystack = [
    resumeText,
    experience.title,
    experience.organization,
    experience.category,
    experience.description,
    experience.tags.join(" "),
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
  const [profile, preferences, experiences] = await Promise.all([
    getUserProfile(userId),
    getUserPreferences(userId),
    getUserExperiences(userId),
  ]);

  const relevantExperiences: RelevantExperienceMemory[] = experiences
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
      category: experience.category,
      description: experience.description,
      tags: experience.tags,
      bullets: experience.bullets.map((bullet) => ({
        content: bullet.content,
        tags: bullet.tags,
      })),
    }));

  return {
    profile,
    preferences,
    relevantExperiences,
  };
}
