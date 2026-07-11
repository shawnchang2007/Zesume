import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import {
  getPrismaClient,
  isDatabaseConfigured,
} from "@/lib/db/prisma";

const databaseEnabled = isDatabaseConfigured();
const authAdapter = databaseEnabled
  ? PrismaAdapter(
      getPrismaClient() as unknown as Parameters<typeof PrismaAdapter>[0],
    )
  : undefined;

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: authAdapter,
  providers: [Google],
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: databaseEnabled ? "database" : "jwt",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user && user?.id) {
        session.user.id = user.id;
      }

      return session;
    },
  },
  trustHost: true,
});
