import type { NextAuthConfig } from "next-auth";

/**
 * Lightweight auth config used by middleware only.
 * Must NOT import Prisma, Google provider, or anything heavy —
 * this runs in the Vercel Edge runtime which has a 1 MB size limit.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isSignInPage = nextUrl.pathname === "/sign-in";
      if (isSignInPage) return true;
      return isLoggedIn;
    },
  },
  providers: [], // providers are added in src/auth.ts, not here
};
