import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import {
  isDatabaseConfigured,
  prisma,
} from "@/lib/db/prisma";

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
  providers: [Google],
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: authDatabaseEnabled ? "database" : "jwt",
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
