import { NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { TargetTemplate } from "@/lib/ai/types";

const targetTemplates = new Set<TargetTemplate>([
  "software_engineering",
  "quant",
  "finance",
]);

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

function isSectionHeading(line: string) {
  const trimmed = line.trim();
  return (
    trimmed.length > 0 &&
    trimmed.length <= 48 &&
    !trimmed.startsWith("-") &&
    !trimmed.startsWith("*") &&
    /^[A-Z][A-Z0-9 /&()'-]+$/.test(trimmed)
  );
}

function createParagraph(line: string) {
  const trimmed = line.trim();

  if (!trimmed) {
    return new Paragraph({ text: "" });
  }

  if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
    return new Paragraph({
      bullet: { level: 0 },
      children: [
        new TextRun({
          text: trimmed.replace(/^[-*]\s*/, ""),
          size: 22,
        }),
      ],
      spacing: { after: 80 },
    });
  }

  if (isSectionHeading(trimmed)) {
    return new Paragraph({
      children: [
        new TextRun({
          text: trimmed,
          bold: true,
          size: 26,
        }),
      ],
      spacing: { before: 220, after: 100 },
    });
  }

  return new Paragraph({
    children: [
      new TextRun({
        text: trimmed,
        size: 22,
      }),
    ],
    spacing: { after: 80 },
  });
}

function fileTemplateName(targetTemplate: TargetTemplate) {
  return targetTemplate.replace(/_/g, "-");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      resumeText?: unknown;
      targetTemplate?: unknown;
      format?: unknown;
    };

    if (typeof body.resumeText !== "string" || !body.resumeText.trim()) {
      return errorResponse("EXPORT_FAILED", "Resume text is required.");
    }

    if (
      typeof body.targetTemplate !== "string" ||
      !targetTemplates.has(body.targetTemplate as TargetTemplate)
    ) {
      return errorResponse("EXPORT_FAILED", "Please choose a valid target template.");
    }

    if (body.format !== "docx") {
      return errorResponse("EXPORT_FAILED", "Only DOCX export is supported here.");
    }

    const paragraphs = body.resumeText
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map(createParagraph);

    const document = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    const buffer = await Packer.toBuffer(document);
    const targetTemplate = body.targetTemplate as TargetTemplate;
    const fileName = `zesume-${fileTemplateName(targetTemplate)}.docx`;

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
