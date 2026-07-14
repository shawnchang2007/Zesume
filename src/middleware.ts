import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const forwardedProtocol = request.headers.get("x-forwarded-proto");
  const cloudflareVisitor = request.headers.get("cf-visitor");
  const isHttp =
    request.nextUrl.protocol === "http:" ||
    forwardedProtocol === "http" ||
    cloudflareVisitor?.includes('"scheme":"http"');
  const isWww = request.nextUrl.hostname === "www.zesume.xyz";

  if (!isHttp && !isWww) {
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
