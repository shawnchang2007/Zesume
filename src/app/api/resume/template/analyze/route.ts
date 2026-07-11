import { NextResponse } from "next/server";
import { analyzeTemplateWithDeepSeek } from "@/lib/ai/providers/deepseek";
import { getCurrentUser } from "@/lib/auth/current-user";
import { checkResumeRewriteRateLimit } from "@/lib/platform/rate-limit";
import {
  extractTextFromResumeFile,
  getFileExtension,
  MAX_RESUME_FILE_SIZE,
  normalizeExtractedText,
  type SupportedResumeFileExtension,
} from "@/lib/resume/file-extraction";

const MIN_TEMPLATE_TEXT_LENGTH = 30;
const MAX_TEMPLATE_TEXT_LENGTH = 20_000;

function errorResponse(code: string, message: string, status = 400) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status },
  );
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    const withinRateLimit = await checkResumeRewriteRateLimit(
      request,
      currentUser?.email,
    );

    if (!withinRateLimit) {
      return errorResponse(
        "RATE_LIMITED",
        "Too many AI requests. Please wait a minute and try again.",
        429,
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return errorResponse(
        "NO_FILE",
        "Please upload a .txt or .docx resume template.",
      );
    }

    if (file.size > MAX_RESUME_FILE_SIZE) {
      return errorResponse(
        "FILE_TOO_LARGE",
        "Template is too large. Please upload a file under 2MB.",
      );
    }

    const extension = getFileExtension(file.name);

    if (extension === ".pdf" || file.type === "application/pdf") {
      return errorResponse(
        "UNSUPPORTED_FILE_TYPE",
        "PDF template analysis is not supported yet. Please upload a .txt or .docx file.",
      );
    }

    if (extension !== ".txt" && extension !== ".docx") {
      return errorResponse(
        "UNSUPPORTED_FILE_TYPE",
        "Unsupported template type. Please upload a .txt or .docx file.",
      );
    }

    let templateText: string;

    try {
      templateText = normalizeExtractedText(
        await extractTextFromResumeFile(
          file,
          extension as SupportedResumeFileExtension,
        ),
      );
    } catch {
      return errorResponse(
        "EXTRACTION_FAILED",
        "Could not read this template. Please try another .txt or .docx file.",
      );
    }

    if (templateText.length < MIN_TEMPLATE_TEXT_LENGTH) {
      return errorResponse(
        "EXTRACTED_TEXT_TOO_SHORT",
        "The template does not contain enough readable structure to analyze.",
      );
    }

    if (templateText.length > MAX_TEMPLATE_TEXT_LENGTH) {
      return errorResponse(
        "EXTRACTED_TEXT_TOO_LONG",
        "The extracted template is too long. Please use a focused resume template under 20,000 characters.",
      );
    }

    const analysis = await analyzeTemplateWithDeepSeek({
      templateText,
      fileName: file.name,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...analysis,
        fileName: file.name,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const code = message.split(":", 1)[0] || "INTERNAL_SERVER_ERROR";

    console.error(JSON.stringify({ event: "template_analysis_failed", code }));

    if (message.startsWith("AI_CONFIG_ERROR")) {
      return errorResponse(
        "AI_CONFIG_ERROR",
        "DeepSeek template analysis is not configured.",
        500,
      );
    }

    if (message.startsWith("AI_TIMEOUT")) {
      return errorResponse(
        "AI_TIMEOUT",
        "Template analysis took too long. Please try again.",
        504,
      );
    }

    if (message.startsWith("AI_PAYMENT_REQUIRED")) {
      return errorResponse(
        "AI_PAYMENT_REQUIRED",
        "DeepSeek account has insufficient balance.",
        402,
      );
    }

    if (message.startsWith("AI_REQUEST_FAILED")) {
      return errorResponse(
        "AI_REQUEST_FAILED",
        "DeepSeek could not analyze this template. Please try again.",
        502,
      );
    }

    return errorResponse("INTERNAL_SERVER_ERROR", "Something went wrong.", 500);
  }
}
