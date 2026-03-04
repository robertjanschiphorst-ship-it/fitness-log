import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// next-auth/jwt is much smaller than the full NextAuth bundle,
// keeping the Vercel proxy function well under the 1 MB limit.
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow: auth endpoints, sign-in page, Next.js internals
  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/sign-in" ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  if (!token) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}
