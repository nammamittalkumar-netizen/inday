import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { resolveRole } from "@/lib/roles";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  // A wrong password is an expected user error, not a server fault — don't spam
  // the console with a red "[auth][error] CredentialsSignin" stack for it.
  logger: {
    error(error) {
      const name = (error as { name?: string })?.name;
      if (name === "CredentialsSignin" || name === "CallbackRouteError") return;
      console.error(error);
    },
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        // Never return passwordHash to the session.
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: resolveRole(user.email, user.role),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.picture = user.image ?? null;
        token.role = user.role;
      }
      // Refresh the avatar and role in the token after a profile update.
      if (trigger === "update" && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { name: true, image: true, email: true, role: true },
        });
        if (fresh) {
          token.name = fresh.name;
          token.picture = fresh.image ?? null;
          token.role = resolveRole(fresh.email, fresh.role);
        }
      }
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
        session.user.image = (token.picture as string | null) ?? null;
        session.user.role = (token.role as Role | undefined) ?? "USER";
      }
      return session;
    },
  },
});
