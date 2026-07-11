import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import {
  getBasicProfile,
  parseBasicProfileInput,
  upsertBasicProfile,
} from "@/lib/profile/basic-profile";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status },
  );
}

async function requireDatabaseUser(request: Request) {
  const currentUser = await getCurrentUser(request);

  if (!currentUser) {
    return { error: errorResponse("UNAUTHORIZED", "Please sign in first.", 401) };
  }

  if (!isDatabaseConfigured() || !currentUser.id) {
    return {
      error: errorResponse(
        "DATABASE_NOT_CONFIGURED",
        "Profile storage is not available yet.",
        503,
      ),
    };
  }

  return { currentUser };
}

export async function GET(request: Request) {
  const authResult = await requireDatabaseUser(request);
  if (authResult.error) return authResult.error;

  const profile = await getBasicProfile(authResult.currentUser.id!);
  return NextResponse.json({ success: true, data: profile });
}

export async function PATCH(request: Request) {
  const authResult = await requireDatabaseUser(request);
  if (authResult.error) return authResult.error;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_INPUT", "Invalid JSON body.", 400);
  }

  const profileInput = parseBasicProfileInput(body);
  if (!profileInput) {
    return errorResponse("INVALID_INPUT", "Invalid profile data.", 400);
  }

  const profile = await upsertBasicProfile(
    authResult.currentUser.id!,
    profileInput,
  );
  return NextResponse.json({ success: true, data: profile });
}
