import type { CareerTarget, RewriteResumeOutput, Tone } from "@/lib/ai/types";
import { prisma } from "@/lib/db/prisma";
import type { ResumeTemplateId } from "@/lib/resume/templates";

type RecordGenerationInput = {
  userId: string;
  resumeText: string;
  result: RewriteResumeOutput;
  targetTrack: CareerTarget;
  templateId: ResumeTemplateId;
  tone: Tone;
  customTemplateId?: string;
  usedMemory: boolean;
  saveGeneration: boolean;
  billingPeriodStart?: Date | null;
  billingPeriodEnd?: Date | null;
};

export async function recordSuccessfulGeneration(input: RecordGenerationInput) {
  return prisma.$transaction(async (transaction) => {
    const generation = await transaction.resumeGeneration.create({
      data: {
        userId: input.userId,
        source: "UPLOAD",
        targetTemplate: input.templateId,
        tone: input.tone,
        customTemplateId: input.customTemplateId,
        inputResumeText: input.saveGeneration ? input.resumeText : null,
        rewrittenResume: input.saveGeneration
          ? input.result.rewrittenResume
          : null,
        suggestions: input.saveGeneration ? input.result.suggestions : [],
        qualityWarnings: input.saveGeneration
          ? input.result.qualityWarnings
          : [],
        usedMemory: input.usedMemory,
        title: `${input.targetTrack} · ${input.templateId}`,
        isSaved: input.saveGeneration,
      },
      select: { id: true },
    });

    await transaction.usageEvent.create({
      data: {
        userId: input.userId,
        type: "RESUME_GENERATION",
        generationId: generation.id,
        billingPeriodStart: input.billingPeriodStart,
        billingPeriodEnd: input.billingPeriodEnd,
      },
    });

    return generation;
  });
}
