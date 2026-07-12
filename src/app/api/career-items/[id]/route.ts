import { NextResponse } from "next/server";
import { BodyTooLargeError, readJsonRequest } from "@/lib/http/body";
import { requireCareerUser } from "@/lib/career-items/access";
import { deleteCareerItem, updateCareerItem } from "@/lib/career-items/service";
import { parseCareerItemInput } from "@/lib/career-items/types";

const MAX_BODY_BYTES = 32 * 1024;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireCareerUser(request);
  if (auth.error) return auth.error;

  try {
    const input = parseCareerItemInput(
      await readJsonRequest<unknown>(request, MAX_BODY_BYTES),
    );
    if (!input) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Check the Career Item fields." } },
        { status: 400 },
      );
    }
    const { id } = await params;
    const item = await updateCareerItem(auth.userId, id, input);
    if (!item) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Career Item not found." } },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    const status = error instanceof BodyTooLargeError ? 413 : 500;
    return NextResponse.json(
      { success: false, error: { code: status === 413 ? "REQUEST_TOO_LARGE" : "INTERNAL_SERVER_ERROR", message: status === 413 ? "Career Item is too large." : "Could not update this Career Item." } },
      { status },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireCareerUser(request);
  if (auth.error) return auth.error;
  const { id } = await params;
  const deleted = await deleteCareerItem(auth.userId, id);
  if (!deleted) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Career Item not found." } },
      { status: 404 },
    );
  }
  return NextResponse.json({ success: true });
}
