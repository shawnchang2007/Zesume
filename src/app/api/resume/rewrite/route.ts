import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { rewriteResume } from "@/lib/ai";
import type { CareerTarget, Tone } from "@/lib/ai/types";
import {
  canGenerate as canAccessGenerate,
  canUseFeature,
  getCurrentAccess,
  recordSuccessfulGeneration,
} from "@/lib/billing";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { BodyTooLargeError, readJsonRequest } from "@/lib/http/body";
import { getMemoryForRewrite } from "@/lib/memory";
import { checkResumeRewriteRateLimit } from "@/lib/platform/rate-limit";
import {
  mergeQualityWarnings,
  validateRewrittenResumeQuality,
} from "@/lib/resume/quality";
import {
  getResumeTemplateSpec,
  isResumeTemplateId,
  parseUploadedTemplateSpec,
} from "@/lib/resume/templates";

const MIN_RESUME_LENGTH = 200;
const MAX_RESUME_LENGTH = 5000;
const MAX_REWRITE_REQUEST_BYTES = 64 * 1024;

const targetTracks = new Set<CareerTarget>([
  "software_engineering",
  "quant",
  "finance",
  "general",
]);

const tones = new Set<Tone>(["professional", "concise", "technical"]);

function errorResponse(
  code: string,
  message: string,
  status = 400,
  headers?: HeadersInit,
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    { status, headers },
  );
}

export async function POST(request: Request) {
  try {
    const body = await readJsonRequest<{
      resumeText?: unknown;
      targetTrack?: unknown;
      targetTemplate?: unknown;
      templateId?: unknown;
      customTemplateId?: unknown;
      tone?: unknown;
      useMemory?: unknown;
      saveGeneration?: unknown;
    }>(request, MAX_REWRITE_REQUEST_BYTES);

    if (typeof body.resumeText !== "string" || !body.resumeText.trim()) {
      return errorResponse("INVALID_INPUT", "Resume text is required.");
    }

    const resumeText = body.resumeText.trim();

    if (resumeText.length < MIN_RESUME_LENGTH) {
      return errorResponse(
        "INVALID_INPUT",
        `Resume text is too short. Please paste at least ${MIN_RESUME_LENGTH} characters.`,
      );
    }

    if (resumeText.length > MAX_RESUME_LENGTH) {
      return errorResponse(
        "INVALID_INPUT",
        `Resume text is too long. Please keep it under ${MAX_RESUME_LENGTH} characters.`,
      );
    }

    const targetTrackValue = body.targetTrack ?? body.targetTemplate;

    if (
      typeof targetTrackValue !== "string" ||
      !targetTracks.has(targetTrackValue as CareerTarget)
    ) {
      return errorResponse("INVALID_INPUT", "Please choose a valid career target.");
    }

    const targetTrack = targetTrackValue as CareerTarget;
    const toneValue = body.tone ?? "professional";

    if (typeof toneValue !== "string" || !tones.has(toneValue as Tone)) {
      return errorResponse("INVALID_INPUT", "Please choose a valid tone.");
    }

    const tone = toneValue as Tone;
    const templateIdValue = body.templateId ?? "classic-ats";

    if (
      typeof templateIdValue !== "string" ||
      !isResumeTemplateId(templateIdValue)
    ) {
      return errorResponse("INVALID_INPUT", "Please choose a valid resume template.");
    }

    let templateSpec =
      templateIdValue === "uploaded-template"
        ? null
        : getResumeTemplateSpec(templateIdValue);
    let customTemplateId: string | undefined;

    if (templateIdValue !== "uploaded-template" && !templateSpec) {
      return errorResponse(
        "INVALID_INPUT",
        "Please choose a valid resume template.",
      );
    }

    const useMemory = body.useMemory === true;
    const saveGeneration = body.saveGeneration === true;
    const currentUser = await getCurrentUser(request);
    const withinRateLimit = await checkResumeRewriteRateLimit(
      request,
      currentUser?.email,
    );

    if (!withinRateLimit) {
      return errorResponse(
        "RATE_LIMITED",
        "Too many rewrite requests. Please wait a minute and try again.",
        429,
        { "Retry-After": "60" },
      );
    }

    const access = await getCurrentAccess(currentUser);

    if (
      currentUser?.id &&
      isDatabaseConfigured() &&
      !access.databaseBacked
    ) {
      return errorResponse(
        "DATABASE_UNAVAILABLE",
        "Account access could not be verified. Please try again.",
        503,
      );
    }

    if (!canAccessGenerate(access)) {
      return errorResponse(
        "GENERATION_LIMIT_REACHED",
        "Your current resume generation limit has been reached.",
        403,
      );
    }

    if (templateIdValue === "uploaded-template") {
      if (!currentUser?.id) {
        return errorResponse(
          "UNAUTHORIZED",
          "Please sign in before using a custom template.",
          401,
        );
      }

      if (!access.databaseBacked || !canUseFeature(access, "CUSTOM_TEMPLATE")) {
        return errorResponse(
          "FEATURE_NOT_AVAILABLE",
          "Custom templates require Plus, Pro, or a Template Pass.",
          403,
        );
      }

      if (
        typeof body.customTemplateId !== "string" ||
        body.customTemplateId.length > 100
      ) {
        return errorResponse(
          "INVALID_UPLOADED_TEMPLATE",
          "Please analyze an uploaded template before generating your resume.",
        );
      }

      const customTemplate = await prisma.customTemplate.findFirst({
        where: {
          id: body.customTemplateId,
          userId: currentUser.id,
          status: "READY",
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: { id: true, parsedSchema: true },
      });
      templateSpec = parseUploadedTemplateSpec(customTemplate?.parsedSchema);

      if (!customTemplate || !templateSpec) {
        return errorResponse(
          "INVALID_UPLOADED_TEMPLATE",
          "This custom template is unavailable or does not belong to your account.",
          404,
        );
      }

      customTemplateId = customTemplate.id;
    }

    if (!templateSpec) {
      return errorResponse("INVALID_INPUT", "Please choose a valid resume template.");
    }

    const memoryWarnings: string[] = [];
    let memory;

    if (useMemory && currentUser?.id) {
      try {
        memory = await getMemoryForRewrite({
          userId: currentUser.id,
          resumeText,
          targetTemplate: targetTrack,
          tone,
        });
      } catch {
        memoryWarnings.push(
          "Memory could not be loaded, so this rewrite used only the pasted resume text.",
        );
      }
    }

    const data = await rewriteResume({
      resumeText,
      targetTrack,
      templateId: templateIdValue,
      templateSpec,
      tone,
      memory,
    });

    const validationWarnings = validateRewrittenResumeQuality({
      sourceText: resumeText,
      rewrittenResume: data.rewrittenResume,
    });

    const qualityWarnings = mergeQualityWarnings(
      data.qualityWarnings,
      validationWarnings,
      memoryWarnings,
    );

    let generationId: string | null = null;
    let remainingGenerations = access.usage.remaining;

    if (currentUser?.id && access.databaseBacked) {
      const generation = await recordSuccessfulGeneration({
        userId: currentUser.id,
        resumeText,
        result: { ...data, qualityWarnings },
        targetTrack,
        templateId: templateIdValue,
        tone,
        customTemplateId,
        usedMemory: Boolean(memory),
        saveGeneration,
        billingPeriodStart: access.usage.periodStart
          ? new Date(access.usage.periodStart)
          : null,
        billingPeriodEnd: access.usage.periodEnd
          ? new Date(access.usage.periodEnd)
          : null,
      });
      generationId = generation.id;
      remainingGenerations = Math.max(0, access.usage.remaining - 1);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        targetTrack,
        templateId: templateIdValue,
        authenticated: Boolean(currentUser),
        generationId,
        remainingGenerations,
        structuredResume: {
          ...data.structuredResume,
          qualityNotes: {
            ...data.structuredResume.qualityNotes,
            warnings: qualityWarnings,
          },
        },
        qualityWarnings,
      },
    });
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return errorResponse(
        "REQUEST_TOO_LARGE",
        "The rewrite request is too large.",
        413,
      );
    }

    const message = error instanceof Error ? error.message : "";
    const errorCode = message.split(":", 1)[0] || "INTERNAL_SERVER_ERROR";

    console.error(
      JSON.stringify({
        event: "resume_rewrite_failed",
        code: errorCode,
      }),
    );

    if (message.startsWith("AI_CONFIG_ERROR")) {
      return errorResponse("AI_CONFIG_ERROR", "The AI provider is not configured.", 500);
    }

    if (message.startsWith("AI_REQUEST_FAILED")) {
      return errorResponse("AI_REQUEST_FAILED", "The AI request failed. Please try again.", 502);
    }

    if (message.startsWith("AI_TIMEOUT")) {
      return errorResponse(
        "AI_TIMEOUT",
        "The AI provider took too long to respond. Please try again.",
        504,
      );
    }

    if (message.startsWith("AI_PAYMENT_REQUIRED")) {
      return errorResponse(
        "AI_PAYMENT_REQUIRED",
        "DeepSeek account has insufficient balance. Please add credits and try again.",
        402,
      );
    }

    return errorResponse("INTERNAL_SERVER_ERROR", "Something went wrong.", 500);
  }
}
