import { NextRequest, NextResponse } from "next/server";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow: auth endpoints, sign-in page, migration route, Next.js internals
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/migrate") ||
    pathname === "/sign-in" ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Auth.js v5 stores the session in one of these cookies depending on HTTP/HTTPS
  const hasSession =
    request.cookies.has("__Secure-authjs.session-token") ||
    request.cookies.has("authjs.session-token");

  if (!hasSession) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}
