import { NextResponse } from "next/server";
import { BodyTooLargeError, readJsonRequest } from "@/lib/http/body";
import { requireCareerUser } from "@/lib/career-items/access";
import { createCareerItem, listCareerItems } from "@/lib/career-items/service";
import { parseCareerItemInput } from "@/lib/career-items/types";

const MAX_BODY_BYTES = 32 * 1024;

export async function GET(request: Request) {
  const auth = await requireCareerUser(request);
  if (auth.error) return auth.error;
  const items = await listCareerItems(auth.userId);
  return NextResponse.json({ success: true, data: items });
}

export async function POST(request: Request) {
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
    const item = await createCareerItem(auth.userId, input);
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    const status = error instanceof BodyTooLargeError ? 413 : 500;
    return NextResponse.json(
      { success: false, error: { code: status === 413 ? "REQUEST_TOO_LARGE" : "INTERNAL_SERVER_ERROR", message: status === 413 ? "Career Item is too large." : "Could not save this Career Item." } },
      { status },
    );
  }
}
