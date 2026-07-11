import { NextResponse } from "next/server";
import { requestFitsDeclaredLimit } from "@/lib/http/body";
import type { CareerTarget } from "@/lib/ai/types";
import { isResumeTemplateId } from "@/lib/resume/templates";
import { normalizeStructuredResume } from "@/lib/resume/structured";
import {
  renderBasicResumeDocx,
  renderResumeIntoUploadedTemplate,
} from "@/lib/resume/template-docx";
import { getFileExtension, MAX_RESUME_FILE_SIZE } from "@/lib/resume/file-extraction";

const targetTracks = new Set<CareerTarget>([
  "software_engineering",
  "quant",
  "finance",
  "general",
]);
const MAX_EXPORT_REQUEST_SIZE = 3 * 1024 * 1024;

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
    if (!requestFitsDeclaredLimit(request, MAX_EXPORT_REQUEST_SIZE)) {
      return errorResponse("EXPORT_FAILED", "Export request is too large.", 413);
    }

    const isMultipart = request.headers
      .get("content-type")
      ?.includes("multipart/form-data");
    let body: {
      resumeText?: unknown;
      targetTrack?: unknown;
      targetTemplate?: unknown;
      templateId?: unknown;
      format?: unknown;
      structuredResume?: unknown;
      templateFile?: unknown;
    };

    if (isMultipart) {
      const formData = await request.formData();
      const structuredResumeText = formData.get("structuredResume");
      let structuredResume: unknown;

      if (typeof structuredResumeText === "string") {
        try {
          structuredResume = JSON.parse(structuredResumeText);
        } catch {
          return errorResponse(
            "EXPORT_FAILED",
            "The structured resume data is invalid.",
          );
        }
      }

      body = {
        resumeText: formData.get("resumeText"),
        targetTrack: formData.get("targetTrack"),
        templateId: formData.get("templateId"),
        format: formData.get("format"),
        structuredResume,
        templateFile: formData.get("templateFile"),
      };
    } else {
      body = (await request.json()) as typeof body;
    }

    if (typeof body.resumeText !== "string" || !body.resumeText.trim()) {
      return errorResponse("EXPORT_FAILED", "Resume text is required.");
    }

    const targetTrackValue = body.targetTrack ?? body.targetTemplate;

    if (
      typeof targetTrackValue !== "string" ||
      !targetTracks.has(targetTrackValue as CareerTarget)
    ) {
      return errorResponse("EXPORT_FAILED", "Please choose a valid career target.");
    }

    const fallbackTemplateId = targetTrackValue.replace(/_/g, "-");
    const templateId =
      typeof body.templateId === "string" &&
      isResumeTemplateId(body.templateId)
        ? body.templateId
        : fallbackTemplateId;

    if (body.format !== "docx") {
      return errorResponse("EXPORT_FAILED", "Only DOCX export is supported here.");
    }

    if (templateId === "uploaded-template" && isMultipart) {
      if (!(body.templateFile instanceof File)) {
        return errorResponse(
          "EXPORT_FAILED",
          "The original uploaded template is required for template-matched export.",
        );
      }

      if (
        body.templateFile.size > MAX_RESUME_FILE_SIZE ||
        getFileExtension(body.templateFile.name) !== ".docx"
      ) {
        return errorResponse(
          "EXPORT_FAILED",
          "Template-matched export requires a .docx template under 2MB.",
        );
      }

      const structuredResume = normalizeStructuredResume(body.structuredResume);

      if (!structuredResume) {
        return errorResponse(
          "EXPORT_FAILED",
          "The generated structured resume is required for template-matched export.",
        );
      }

      const renderedTemplate = await renderResumeIntoUploadedTemplate({
        templateFile: body.templateFile,
        structuredResume,
        targetTrack: targetTrackValue as CareerTarget,
      });
      const templateBody = new Blob([new Uint8Array(renderedTemplate)], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      return new NextResponse(templateBody, {
        headers: {
          "Content-Disposition":
            'attachment; filename="zesume-uploaded-template.docx"',
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "X-Zesume-Export-Mode": "template-matched",
        },
      });
    }

    const buffer = await renderBasicResumeDocx(body.resumeText);
    const fileName = `zesume-${templateId}.docx`;

    const docxBody = new Blob([new Uint8Array(buffer)], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    return new NextResponse(docxBody, {
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
    });
  } catch {
    return errorResponse("EXPORT_FAILED", "Could not export this resume.", 500);
  }
}
