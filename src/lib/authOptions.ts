// src/lib/authOptions.ts

import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';
import dbConnect from '@/lib/dbConnect';
import User, { IUser } from '@/models/User';
import * as bcrypt from 'bcryptjs';
import { Adapter } from 'next-auth/adapters';

// Explicit type for user returned from .lean()
interface LeanUser extends Omit<IUser, '_id'> {
  _id: string;
  password?: string;
}

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.NODE_ENV === 'development' ? 'udyog-jagat-dev' : 'udyog-jagat',
  }) as Adapter,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password', required: false },
        referralCode: { label: 'Referral Code', type: 'text', required: false },
      },
      async authorize(credentials) {
        await dbConnect();

        if (!credentials?.email) {
          throw new Error('Email is required.');
        }

        const user = await User.findOne({ email: credentials.email })
          .select('+password referralCodeUsed status role name image referralExpiresAt')
          .lean() as LeanUser | null;

        if (!user) {
          throw new Error('Invalid email or credentials.');
        }

        if (user.role === 'Administrator' && credentials.password) {
          if (!user.password) {
            throw new Error('Administrator account has no password set.');
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) {
            throw new Error('Invalid email or password.');
          }

          return {
            id: user._id,
            email: user.email,
            role: user.role,
            status: user.status,
            name: user.name,
            image: user.image,
            referralCodeUsed: user.referralCodeUsed,
            referralExpiresAt: user.referralExpiresAt,
          };
        }

        if (!credentials.referralCode) {
          throw new Error('Referral Code is required for non-admin login.');
        }

        if (user.status === 'Pending') {
          throw new Error('Account is pending approval. Please wait for an administrator to approve your request.');
        }
        if (user.status === 'Rejected') {
          throw new Error('Your account has been rejected. Please contact support.');
        }

        if (!user.referralCodeUsed || user.referralCodeUsed !== credentials.referralCode) {
          throw new Error('Invalid email or referral code.');
        }

        if (user.referralExpiresAt && user.referralExpiresAt < new Date()) {
          throw new Error('Referral code expired.');
        }

        return {
          id: user._id,
          email: user.email,
          role: user.role,
          status: user.status,
          name: user.name,
          image: user.image,
          referralCodeUsed: user.referralCodeUsed,
          referralExpiresAt: user.referralExpiresAt,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET!,
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
        token.status = user.status;
        token.name = user.name;
        token.image = user.image;
        token.referralCodeUsed = user.referralCodeUsed;
        token.referralExpiresAt = user.referralExpiresAt;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.role = token.role;
        session.user.status = token.status;
        session.user.name = token.name;
        session.user.image = token.image;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET!,
};
