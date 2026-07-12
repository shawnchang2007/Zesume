import { NextResponse } from "next/server";
import { analyzeCareerImport } from "@/lib/ai";
import { requireCareerUser } from "@/lib/career-items/access";
import { prisma } from "@/lib/db/prisma";
import { requestFitsDeclaredLimit } from "@/lib/http/body";
import { checkResumeRewriteRateLimit } from "@/lib/platform/rate-limit";
import {
  extractTextFromResumeFile,
  getFileExtension,
  MAX_RESUME_FILE_SIZE,
  normalizeExtractedText,
} from "@/lib/resume/file-extraction";

const MAX_MULTIPART_BYTES = 3 * 1024 * 1024;
const MIN_TEXT_LENGTH = 100;
const MAX_TEXT_LENGTH = 20_000;

function error(code: string, message: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

export async function POST(request: Request) {
  try {
    if (!requestFitsDeclaredLimit(request, MAX_MULTIPART_BYTES)) {
      return error("FILE_TOO_LARGE", "Upload request is too large.", 413);
    }
    const auth = await requireCareerUser(request, "PROFILE_IMPORT");
    if (auth.error) return auth.error;
    if (!(await checkResumeRewriteRateLimit(request))) {
      return error("RATE_LIMITED", "Too many AI requests. Please wait a minute.", 429);
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return error("NO_FILE", "Upload a .txt or .docx resume.", 400);
    if (file.size > MAX_RESUME_FILE_SIZE) return error("FILE_TOO_LARGE", "Upload a file under 2MB.", 413);

    const extension = getFileExtension(file.name);
    if (extension === ".pdf" || file.type === "application/pdf") {
      return error("UNSUPPORTED_FILE_TYPE", "PDF import is not supported yet. Upload .txt or .docx.", 415);
    }
    if (extension !== ".txt" && extension !== ".docx") {
      return error("UNSUPPORTED_FILE_TYPE", "Upload a .txt or .docx resume.", 415);
    }

    const resumeText = normalizeExtractedText(
      await extractTextFromResumeFile(file, extension),
    ).slice(0, MAX_TEXT_LENGTH);
    if (resumeText.length < MIN_TEXT_LENGTH) {
      return error("EXTRACTED_TEXT_TOO_SHORT", "The extracted resume is too short to import.", 422);
    }

    const analysis = await analyzeCareerImport({ resumeText, fileName: file.name });
    const draft = await prisma.resumeImportDraft.create({
      data: {
        userId: auth.userId,
        parsedData: JSON.parse(JSON.stringify({ items: analysis.items })),
        warnings: JSON.parse(JSON.stringify(analysis.warnings)),
        status: "REVIEW",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1_000),
      },
      select: { id: true, expiresAt: true },
    });
    await prisma.usageEvent.create({
      data: { userId: auth.userId, type: "PROFILE_IMPORT" },
    });

    return NextResponse.json({
      success: true,
      data: {
        draftId: draft.id,
        expiresAt: draft.expiresAt.toISOString(),
        items: analysis.items,
        warnings: analysis.warnings,
      },
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "";
    if (message.startsWith("AI_TIMEOUT")) return error("AI_TIMEOUT", "Resume analysis took too long. Please try again.", 504);
    if (message.startsWith("AI_PAYMENT_REQUIRED")) return error("AI_PAYMENT_REQUIRED", "AI analysis is temporarily unavailable.", 503);
    if (message.startsWith("AI_")) return error("IMPORT_ANALYSIS_FAILED", "Could not analyze this resume.", 502);
    return error("IMPORT_FAILED", "Could not import this resume.", 500);
  }
}
