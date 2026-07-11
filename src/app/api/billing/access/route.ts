import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCurrentAccess } from "@/lib/billing";

export async function GET(request: Request) {
  const currentUser = await getCurrentUser(request);
  const access = await getCurrentAccess(currentUser);

  return NextResponse.json({ success: true, data: access });
}
