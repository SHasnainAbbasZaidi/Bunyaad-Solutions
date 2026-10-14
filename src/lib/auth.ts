import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "@/lib/db";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "./rate-limit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        if (
          typeof credentials.email !== "string" ||
          typeof credentials.password !== "string"
        )
          return null;
        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password;
        if (email.length > 254 || password.length > 128) return null;
        const checks = await Promise.all([
          checkRateLimit(`login:email:${email}`, RATE_LIMITS.login),
          checkRateLimit(`login:ip:${getClientIp(request)}`, {
            maxRequests: 30,
            windowSeconds: 300,
          }),
        ]);
        if (checks.some((check) => !check.allowed)) return null;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.active) {
          await compare(
            password,
            "$2b$12$C6UzMDM.H6dfI/f/IKcEe.1dbvtQPxfAW4xE0X7UGxTZyOjShQSr2",
          );
          return null;
        }

        const isPasswordValid = await compare(password, user.passwordHash);

        if (!isPasswordValid) {
          return null;
        }

        // Log the login activity
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: "LOGIN",
            entityType: "User",
            entityId: user.id,
            details: `User ${user.name} logged in`,
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.sessionVersion = (
          user as unknown as { sessionVersion: number }
        ).sessionVersion;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
        (session.user as unknown as { sessionVersion: number }).sessionVersion =
          token.sessionVersion as number;
      }
      return session;
    },
    async authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isOnLoginPage = nextUrl.pathname === "/admin/login";

      if (isOnAdmin && !isOnLoginPage) {
        if (!isLoggedIn)
          return Response.redirect(new URL("/admin/login", nextUrl));
        return true;
      }

      if (isOnLoginPage && isLoggedIn) {
        return Response.redirect(new URL("/admin/dashboard", nextUrl));
      }

      return true;
    },
  },
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  trustHost: true,
});
