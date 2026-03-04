import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email || !ALLOWED_EMAILS.includes(user.email)) return false;

      // First time the primary user (first in list) signs in:
      // claim all legacy records that have no userId yet (userId = "")
      if (user.email === ALLOWED_EMAILS[0]) {
        await prisma.workoutSession.updateMany({
          where: { userId: "" },
          data: { userId: user.email },
        });
        await prisma.workoutTemplate.updateMany({
          where: { userId: "" },
          data: { userId: user.email },
        });
      }

      return true;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
});
