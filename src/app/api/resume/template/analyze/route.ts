import { NextResponse } from "next/server";
import { requestFitsDeclaredLimit } from "@/lib/http/body";
import { analyzeTemplateWithDeepSeek } from "@/lib/ai/providers/deepseek";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canUseFeature, getCurrentAccess } from "@/lib/billing";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { TEMPLATE_FAIR_USE_LIMITS } from "@/lib/billing/plan-config";
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
const MAX_MULTIPART_REQUEST_SIZE = 3 * 1024 * 1024;

function errorResponse(code: string, message: string, status = 400) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status },
  );
}

export async function POST(request: Request) {
  try {
    if (!requestFitsDeclaredLimit(request, MAX_MULTIPART_REQUEST_SIZE)) {
      return errorResponse("FILE_TOO_LARGE", "Upload request is too large.", 413);
    }

    const currentUser = await getCurrentUser(request);

    if (!currentUser?.id) {
      return errorResponse(
        "UNAUTHORIZED",
        "Please sign in before analyzing a custom template.",
        401,
      );
    }

    if (!isDatabaseConfigured()) {
      return errorResponse(
        "DATABASE_UNAVAILABLE",
        "Custom template storage is not available.",
        503,
      );
    }

    const access = await getCurrentAccess(currentUser);

    if (!access.databaseBacked) {
      return errorResponse(
        "DATABASE_UNAVAILABLE",
        "Account access could not be verified. Please try again.",
        503,
      );
    }

    if (!canUseFeature(access, "CUSTOM_TEMPLATE")) {
      return errorResponse(
        "FEATURE_NOT_AVAILABLE",
        "Custom template analysis requires Plus or Pro.",
        403,
      );
    }

    const activeTemplateCount = await prisma.customTemplate.count({
      where: {
        userId: currentUser.id,
        status: { in: ["PROCESSING", "READY"] },
        expiresAt: { gt: new Date() },
      },
    });

    if (activeTemplateCount >= TEMPLATE_FAIR_USE_LIMITS.maxActiveTemplates) {
      return errorResponse(
        "TEMPLATE_LIMIT_REACHED",
        "Your active custom template limit has been reached.",
        403,
      );
    }
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

    const customTemplate = await prisma.customTemplate.create({
      data: {
        userId: currentUser.id,
        name: analysis.templateSpec.name,
        originalFileName: file.name.slice(0, 255),
        mimeType: file.type.slice(0, 120) || null,
        parsedSchema: JSON.parse(JSON.stringify(analysis.templateSpec)),
        previewText: templateText.slice(0, 5_000),
        status: "READY",
        reusable: false,
        expiresAt: new Date(
          Date.now() + TEMPLATE_FAIR_USE_LIMITS.templateTokenHours * 60 * 60 * 1_000,
        ),
      },
      select: { id: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...analysis,
        fileName: file.name,
        customTemplateId: customTemplate.id,
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
