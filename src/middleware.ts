import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.hostname !== "www.zesume.xyz") {
    return NextResponse.next();
  }

  const canonicalUrl = request.nextUrl.clone();
  canonicalUrl.hostname = "zesume.xyz";
  canonicalUrl.protocol = "https";

  return NextResponse.redirect(canonicalUrl, 308);
}

export const config = {
  matcher: "/:path*",
};
