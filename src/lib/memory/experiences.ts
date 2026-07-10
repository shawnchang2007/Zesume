import { prisma } from "@/lib/db/prisma";

export type CreateExperienceInput = {
  title: string;
  organization?: string;
  category: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  isCurrent?: boolean;
  tags?: string[];
  bullets?: Array<{
    content: string;
    source?: string;
    tags?: string[];
    confidence?: number;
  }>;
};

export async function getUserExperiences(userId: string) {
  return prisma.experience.findMany({
    where: { userId },
    include: { bullets: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createExperience(
  userId: string,
  data: CreateExperienceInput,
) {
  return prisma.experience.create({
    data: {
      userId,
      title: data.title,
      organization: data.organization,
      category: data.category,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      isCurrent: data.isCurrent ?? false,
      tags: data.tags ?? [],
      bullets: {
        create:
          data.bullets?.map((bullet) => ({
            content: bullet.content,
            source: bullet.source,
            tags: bullet.tags ?? [],
            confidence: bullet.confidence,
          })) ?? [],
      },
    },
    include: { bullets: true },
  });
}

export async function deleteExperience(userId: string, experienceId: string) {
  return prisma.experience.delete({
    where: {
      id: experienceId,
      userId,
    },
  });
}
