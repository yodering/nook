import { type NextAuthOptions, getServerSession } from "next-auth";
import { type JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

function sanitizeEnv(value: string): string {
  const trimmed = value.trim();
  const hasDoubleQuotes =
    trimmed.startsWith("\"") && trimmed.endsWith("\"");
  const hasSingleQuotes =
    trimmed.startsWith("'") && trimmed.endsWith("'");

  if (hasDoubleQuotes || hasSingleQuotes) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function readEnv(
  name: "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET" | "NEXTAUTH_SECRET",
): string | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;

  const value = sanitizeEnv(raw);
  if (!value) return undefined;

  return value;
}

const GOOGLE_CLIENT_ID = readEnv("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = readEnv("GOOGLE_CLIENT_SECRET");
const NEXTAUTH_SECRET = readEnv("NEXTAUTH_SECRET");

if (GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.endsWith(".apps.googleusercontent.com")) {
  console.error(
    "[auth] GOOGLE_CLIENT_ID appears malformed. It should end with .apps.googleusercontent.com",
  );
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    if (!token.refreshToken || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return { ...token, error: "RefreshAccessTokenError" };
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
      cache: "no-store",
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch {
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
  secret: NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID ?? "",
      clientSecret: GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/calendar",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account && user.email) {
        await prisma.user.upsert({
          where: { googleId: account.providerAccountId },
          update: { email: user.email },
          create: {
            googleId: account.providerAccountId,
            email: user.email,
          },
        });
      }
      return true;
    },
    async jwt({ token, account }) {
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          accessTokenExpires: account.expires_at
            ? account.expires_at * 1000
            : Date.now() + 60 * 60 * 1000,
          refreshToken: account.refresh_token ?? token.refreshToken,
          error: undefined,
        };
      }

      if (
        typeof token.accessTokenExpires === "number" &&
        Date.now() < token.accessTokenExpires
      ) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}
