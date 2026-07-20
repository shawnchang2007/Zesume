import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import {
  isDatabaseConfigured,
  prisma,
} from "@/lib/db/prisma";
import { authorizeEmailLogin } from "@/lib/auth/email-code";
import { checkAuthEmailRateLimit } from "@/lib/platform/rate-limit";

const databaseEnabled = isDatabaseConfigured();
const authDatabaseEnabled =
  databaseEnabled && process.env.AUTH_DATABASE_ENABLED === "true";
const authAdapter = authDatabaseEnabled
  ? PrismaAdapter(
      prisma as unknown as Parameters<typeof PrismaAdapter>[0],
    )
  : undefined;

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: authAdapter,
  providers: [
    Google,
    Credentials({
      id: "email-code",
      name: "Email code",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Verification code", type: "text" },
      },
      async authorize(credentials, request) {
        if (!(await checkAuthEmailRateLimit(request, "verify"))) {
          return null;
        }

        return authorizeEmailLogin(credentials.email, credentials.code);
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  session: {
    // Credentials authentication requires JWT sessions. Prisma still stores
    // users, plans, history, and product data for both login methods.
    strategy: "jwt",
  },
  callbacks: {
    session({ session, user, token }) {
      const userId = user?.id ?? token?.sub;

      if (session.user && userId) {
        session.user.id = userId;
      }

      return session;
    },
  },
  trustHost: true,
});
