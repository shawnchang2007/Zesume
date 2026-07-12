import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { renderBasicResumeDocx } from "@/lib/resume/template-docx";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status },
  );
}

function downloadName(templateId: string, format: "txt" | "docx") {
  const safeTemplate = templateId.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  return `zesume-${safeTemplate || "resume"}.${format}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser(request);

  if (!currentUser?.id) {
    return errorResponse("UNAUTHORIZED", "Please sign in first.", 401);
  }

  if (!isDatabaseConfigured()) {
    return errorResponse(
      "DATABASE_UNAVAILABLE",
      "Resume history is temporarily unavailable.",
      503,
    );
  }

  const format = new URL(request.url).searchParams.get("format");

  if (format !== "txt" && format !== "docx") {
    return errorResponse("INVALID_FORMAT", "Choose TXT or DOCX.", 400);
  }

  const { id } = await params;
  const generation = await prisma.resumeGeneration.findFirst({
    where: {
      id,
      userId: currentUser.id,
      isSaved: true,
      deletedAt: null,
    },
    select: { rewrittenResume: true, targetTemplate: true },
  });

  if (!generation?.rewrittenResume?.trim()) {
    return errorResponse(
      "HISTORY_NOT_FOUND",
      "This saved resume is unavailable or no longer retained.",
      404,
    );
  }

  const fileName = downloadName(generation.targetTemplate, format);

  if (format === "txt") {
    return new NextResponse(generation.rewrittenResume, {
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  try {
    const buffer = await renderBasicResumeDocx(generation.rewrittenResume);
    const body = new Blob([new Uint8Array(buffer)], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    return new NextResponse(body, {
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return errorResponse("EXPORT_FAILED", "Could not export this resume.", 500);
  }
}
