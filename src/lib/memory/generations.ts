import { prisma } from "@/lib/db/prisma";
import type { ResumeMemoryContext } from "./types";

export type SaveResumeGenerationInput = {
  targetTemplate: string;
  tone: string;
  inputResumeText?: string;
  rewrittenResume?: string;
  suggestions?: string[];
  qualityWarnings?: string[];
  usedMemory?: boolean;
  memorySnapshot?: ResumeMemoryContext | null;
  title?: string;
};

export async function saveResumeGeneration(
  userId: string,
  data: SaveResumeGenerationInput,
) {
  return prisma.resumeGeneration.create({
    data: {
      userId,
      targetTemplate: data.targetTemplate,
      tone: data.tone,
      inputResumeText: data.inputResumeText,
      rewrittenResume: data.rewrittenResume,
      suggestions: data.suggestions ?? [],
      qualityWarnings: data.qualityWarnings ?? [],
      usedMemory: data.usedMemory ?? false,
      memorySnapshot: data.memorySnapshot ?? undefined,
      title: data.title,
      isSaved: true,
    },
  });
}

export async function listResumeGenerations(userId: string) {
  return prisma.resumeGeneration.findMany({
    where: { userId, isSaved: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function deleteResumeGeneration(
  userId: string,
  generationId: string,
) {
  return prisma.resumeGeneration.delete({
    where: {
      id: generationId,
      userId,
    },
  });
}
