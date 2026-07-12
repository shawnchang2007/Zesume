import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canUseFeature, getCurrentAccess } from "@/lib/billing";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import type { GatedFeature } from "@/lib/billing/plan-config";

function error(code: string, message: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

export async function requireCareerUser(
  request: Request,
  feature: GatedFeature = "CAREER_EXPERIENCE",
) {
  const user = await getCurrentUser(request);
  if (!user?.id) return { error: error("UNAUTHORIZED", "Please sign in first.", 401) };
  if (!isDatabaseConfigured()) {
    return { error: error("DATABASE_UNAVAILABLE", "Career Memory is temporarily unavailable.", 503) };
  }
  const access = await getCurrentAccess(user);
  if (!access.databaseBacked) {
    return { error: error("DATABASE_UNAVAILABLE", "Account access could not be verified.", 503) };
  }
  if (!canUseFeature(access, feature)) {
    return { error: error("FEATURE_NOT_AVAILABLE", "Career Memory is available on Pro.", 403) };
  }
  return { userId: user.id, access };
}
