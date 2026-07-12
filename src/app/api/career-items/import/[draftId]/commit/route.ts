import { NextResponse } from "next/server";
import { requireCareerUser } from "@/lib/career-items/access";
import { parseCareerImportOutput } from "@/lib/career-items/import";
import { commitCareerImportDraft } from "@/lib/career-items/service";
import { prisma } from "@/lib/db/prisma";
import { BodyTooLargeError, readJsonRequest } from "@/lib/http/body";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ draftId: string }> },
) {
  const auth = await requireCareerUser(request, "PROFILE_IMPORT");
  if (auth.error) return auth.error;
  let selectedCount = 0;

  try {
    const body = await readJsonRequest<{ selectedIndexes?: unknown }>(request, 4 * 1024);
    const selectedIndexes = Array.isArray(body.selectedIndexes)
      ? [...new Set(body.selectedIndexes.filter((value): value is number => Number.isInteger(value) && value >= 0))].slice(0, 30)
      : [];
    if (!selectedIndexes.length) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Select at least one Career Item." } },
        { status: 400 },
      );
    }

    const { draftId } = await params;
    const draft = await prisma.resumeImportDraft.findFirst({
      where: { id: draftId, userId: auth.userId, status: "REVIEW", expiresAt: { gt: new Date() } },
      select: { parsedData: true, warnings: true },
    });
    if (!draft) {
      return NextResponse.json(
        { success: false, error: { code: "DRAFT_NOT_FOUND", message: "This import draft expired or was already used." } },
        { status: 404 },
      );
    }

    const parsed = parseCareerImportOutput({
      ...(draft.parsedData as object),
      warnings: draft.warnings,
    });
    const selected = selectedIndexes
      .map((index) => parsed.items[index])
      .filter((item): item is (typeof parsed.items)[number] => Boolean(item));
    selectedCount = selected.length;
    if (!selected.length) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Selected Career Items are invalid." } },
        { status: 400 },
      );
    }

    const ids = await commitCareerImportDraft(auth.userId, draftId, selected);
    if (!ids) {
      return NextResponse.json(
        { success: false, error: { code: "DRAFT_NOT_FOUND", message: "This import draft expired or was already used." } },
        { status: 409 },
      );
    }
    return NextResponse.json({ success: true, data: { createdCount: ids.length, ids } });
  } catch (cause) {
    const status = cause instanceof BodyTooLargeError ? 413 : 500;
    const code =
      cause && typeof cause === "object" && "code" in cause
        ? String(cause.code)
        : "UNKNOWN";
    console.error(JSON.stringify({
      event: "career_import_commit_failed",
      code,
      selectedCount,
    }));
    return NextResponse.json(
      { success: false, error: { code: status === 413 ? "REQUEST_TOO_LARGE" : "IMPORT_COMMIT_FAILED", message: status === 413 ? "Request is too large." : "Could not save imported Career Items." } },
      { status },
    );
  }
}
