import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { checkRateLimit } from '@/lib/rate-limit';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Northstone Realty',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid email or password.');
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();
        const forwardedFor = request.headers?.['x-forwarded-for'];
        const clientIdentifier =
          typeof forwardedFor === 'string'
            ? forwardedFor.split(',')[0]?.trim() || 'unknown'
            : 'unknown';
        const [emailLimit, ipLimit] = await Promise.all([
          checkRateLimit({
            scope: 'login-email',
            identifier: normalizedEmail,
            limit: 8,
            windowMs: 15 * 60 * 1000,
          }),
          checkRateLimit({
            scope: 'login-ip',
            identifier: clientIdentifier,
            limit: 30,
            windowMs: 15 * 60 * 1000,
          }),
        ]);
        if (!emailLimit.allowed || !ipLimit.allowed) {
          throw new Error('Invalid email or password.');
        }

        await connectToDatabase();

        const user = await User.findOne({
          email: normalizedEmail,
        }).select('+passwordHash');

        // Anti-enumeration: uniform error message
        if (!user || !user.isActive) {
          throw new Error('Invalid email or password.');
        }

        if (user.lockoutExpires && user.lockoutExpires > new Date()) {
          throw new Error(
            'Account temporarily locked. Please try again later.'
          );
        }

        const passwordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!passwordValid) {
          user.failedLoginAttempts = (user.failedLoginAttempts ?? 0) + 1;
          if (user.failedLoginAttempts >= 5) {
            user.lockoutExpires = new Date(Date.now() + 15 * 60 * 1000);
          }
          await user.save();
          throw new Error('Invalid email or password.');
        }

        // Reset failed login attempts on successful sign-in
        user.failedLoginAttempts = 0;
        user.lockoutExpires = undefined;
        user.lastLoginAt = new Date();
        await user.save();

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          tokenVersion: user.tokenVersion,
        };
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role?: string }).role ?? 'CUSTOMER';
        token.tokenVersion =
          (user as unknown as { tokenVersion?: number }).tokenVersion ?? 0;
      }

      if (trigger === 'update' && session) {
        Object.assign(token, session);
      }

      // Revalidate tokenVersion against database for instant session revocation
      if (token.id) {
        try {
          await connectToDatabase();
          const dbUser = await User.findById(token.id)
            .select('isActive tokenVersion')
            .lean();

          if (
            !dbUser ||
            !dbUser.isActive ||
            dbUser.tokenVersion !== token.tokenVersion
          ) {
            return {};
          }
        } catch {
          // Fail closed: a session that cannot be revalidated is not authorized.
          return {};
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (!token?.id || !session.user) return session;
      (session.user as Record<string, unknown>).id = token.id;
      (session.user as Record<string, unknown>).role = token.role;
      (session.user as Record<string, unknown>).tokenVersion = token.tokenVersion;
      return session;
    },
  },

  pages: {
    signIn: '/login',
  },

  secret: process.env.NEXTAUTH_SECRET,
};
