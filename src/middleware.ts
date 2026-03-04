import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Use only the lightweight config here — no Prisma, no Google provider,
// just JWT token checking. Keeps the Edge Function under the 1 MB limit.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
