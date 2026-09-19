import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db';

const googleClientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || '';
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';

const githubClientId = process.env.AUTH_GITHUB_ID || process.env.GITHUB_CLIENT_ID || '';
const githubClientSecret = process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET || '';

export const isGoogleConfigured = Boolean(googleClientId && googleClientSecret);
export const isGitHubConfigured = Boolean(githubClientId && githubClientSecret);

const providers = [];

if (isGoogleConfigured) {
  providers.push(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

if (isGitHubConfigured) {
  providers.push(
    GitHub({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

const isProd = process.env.NODE_ENV === 'production';
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

if (isProd && !authSecret && !process.env.NEXT_PHASE) {
  console.error(
    '[SECURITY CRITICAL] AUTH_SECRET or NEXTAUTH_SECRET is missing in production environment. JWT sessions will not use fallback.'
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: prisma ? PrismaAdapter(prisma) : undefined,
  providers,
  secret: authSecret || (isProd ? undefined : 'bluff_default_secret_for_local_development_only'),
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token?.sub && session?.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  trustHost: true,
  debug: true,
});
