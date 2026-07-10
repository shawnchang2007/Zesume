import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { rewriteResume } from "@/lib/ai";
import type { TargetTemplate, Tone } from "@/lib/ai/types";
import { getMemoryForRewrite } from "@/lib/memory";
import {
  mergeQualityWarnings,
  validateRewrittenResumeQuality,
} from "@/lib/resume/quality";

const MIN_RESUME_LENGTH = 200;
const MAX_RESUME_LENGTH = 5000;

const targetTemplates = new Set<TargetTemplate>([
  "software_engineering",
  "quant",
  "finance",
]);

const tones = new Set<Tone>(["professional", "concise", "technical"]);

function errorResponse(code: string, message: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    { status },
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      resumeText?: unknown;
      targetTemplate?: unknown;
      tone?: unknown;
      useMemory?: unknown;
    };

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

    if (
      typeof body.targetTemplate !== "string" ||
      !targetTemplates.has(body.targetTemplate as TargetTemplate)
    ) {
      return errorResponse("INVALID_INPUT", "Please choose a valid target template.");
    }

    if (typeof body.tone !== "string" || !tones.has(body.tone as Tone)) {
      return errorResponse("INVALID_INPUT", "Please choose a valid tone.");
    }

    const useMemory = body.useMemory === true;
    const currentUser = useMemory ? await getCurrentUser(request) : null;
    const memoryWarnings: string[] = [];
    let memory;

    if (useMemory && currentUser) {
      try {
        memory = await getMemoryForRewrite({
          userId: currentUser.id,
          resumeText,
          targetTemplate: body.targetTemplate as TargetTemplate,
          tone: body.tone as Tone,
        });
      } catch {
        memoryWarnings.push(
          "Memory could not be loaded, so this rewrite used only the pasted resume text.",
        );
      }
    }

    const data = await rewriteResume({
      resumeText,
      targetTemplate: body.targetTemplate as TargetTemplate,
      tone: body.tone as Tone,
      memory,
    });

    const validationWarnings = validateRewrittenResumeQuality({
      sourceText: resumeText,
      rewrittenResume: data.rewrittenResume,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        qualityWarnings: mergeQualityWarnings(
          data.qualityWarnings,
          validationWarnings,
          memoryWarnings,
        ),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.startsWith("AI_CONFIG_ERROR")) {
      return errorResponse("AI_CONFIG_ERROR", "The AI provider is not configured.", 500);
    }

    if (message.startsWith("AI_REQUEST_FAILED")) {
      return errorResponse("AI_REQUEST_FAILED", "The AI request failed. Please try again.", 502);
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
