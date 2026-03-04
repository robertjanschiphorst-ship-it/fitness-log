import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      // Support both Auth.js v5 naming (AUTH_GOOGLE_ID) and common alternatives
      clientId: process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET ?? "",
      // Disable PKCE — the code verifier cookie is unreliable on Vercel serverless.
      // Use a simple state check instead.
      checks: ["state"],
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      console.log("[auth] signIn attempt:", user.email, "| allowed:", ALLOWED_EMAILS);
      if (!user.email || !ALLOWED_EMAILS.includes(user.email)) return false;

      // First time the primary user (first in ALLOWED_EMAILS) signs in:
      // claim all legacy records that have no userId yet (userId = "")
      if (user.email === ALLOWED_EMAILS[0]) {
        try {
          await prisma.workoutSession.updateMany({
            where: { userId: "" },
            data: { userId: user.email },
          });
          await prisma.workoutTemplate.updateMany({
            where: { userId: "" },
            data: { userId: user.email },
          });
        } catch (e) {
          // Column may not exist yet if /api/migrate hasn't been run — don't block sign-in
          console.warn("[auth] legacy claim skipped (migration not run yet?):", e);
        }
      }

      return true;
    },
  },
});
