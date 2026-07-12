import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { canUseFeature, getCurrentAccess } from "@/lib/billing";
import { buildProfileResumeSource } from "@/lib/profile/resume-source";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status },
  );
}

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.id) {
    return errorResponse("UNAUTHORIZED", "Please sign in first.", 401);
  }

  const access = await getCurrentAccess(currentUser, { includeUsage: false });

  if (!access.databaseBacked) {
    return errorResponse(
      "DATABASE_UNAVAILABLE",
      "Profile import is temporarily unavailable.",
      503,
    );
  }

  if (!canUseFeature(access, "PROFILE_GENERATION")) {
    return errorResponse(
      "FEATURE_NOT_AVAILABLE",
      "Import from Profile is available on Pro.",
      403,
    );
  }

  const resumeText = await buildProfileResumeSource(currentUser.id);

  if (resumeText.length < 200) {
    return errorResponse(
      "PROFILE_TOO_SHORT",
      "Add more profile and Career Experience details before importing.",
      422,
    );
  }

  return NextResponse.json({
    success: true,
    data: { resumeText, characterCount: resumeText.length },
  });
}
