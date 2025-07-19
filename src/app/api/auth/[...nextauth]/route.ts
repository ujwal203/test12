// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { DefaultSession, AuthOptions, Session, User as NextAuthUser } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';
import dbConnect from '@/lib/dbConnect';
import User, { IUser } from '@/models/User';
import * as bcrypt from 'bcryptjs';
import { Adapter } from 'next-auth/adapters';

// Extend NextAuth types to include 'role' and 'status' in User and Session
declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    role: 'Guest' | 'Job Seeker' | 'Job Poster' | 'Referrer' | 'Administrator';
    status: 'Pending' | 'Approved' | 'Rejected';
    name?: string;
    image?: string;
    referralCodeUsed?: string;
    referralExpiresAt?: Date;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      role: 'Guest' | 'Job Seeker' | 'Job Poster' | 'Referrer' | 'Administrator';
      status: 'Pending' | 'Approved' | 'Rejected';
      name?: string;
      image?: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    role: 'Guest' | 'Job Seeker' | 'Job Poster' | 'Referrer' | 'Administrator';
    status: 'Pending' | 'Approved' | 'Rejected';
    name?: string;
    image?: string;
    referralCodeUsed?: string;
    referralExpiresAt?: Date;
  }
}

// Augment the AdapterUser type from 'next-auth/adapters' directly
declare module 'next-auth/adapters' {
  interface AdapterUser {
    role: 'Guest' | 'Job Seeker' | 'Job Poster' | 'Referrer' | 'Administrator';
    status: 'Pending' | 'Approved' | 'Rejected';
    referralCodeUsed?: string;
    referralExpiresAt?: Date;
  }
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
        password: { label: 'Password', type: 'password', required: false }, // Password is now optional for credentials
        referralCode: { label: 'Referral Code', type: 'text', required: false }, // Referral code is also optional
      },
      async authorize(credentials) {
        await dbConnect();

        if (!credentials?.email) {
          throw new Error('Email is required.');
        }

        const user = await User.findOne({ email: credentials.email })
          .select('+password referralCodeUsed status role name image referralExpiresAt') // Select password for admin check
          .lean() as (IUser & { password?: string }) | null;

        if (!user) {
          throw new Error('Invalid email or credentials.');
        }

        // --- Admin Login Logic (Email + Password) ---
        if (user.role === 'Administrator' && credentials.password) {
          if (!user.password) {
            throw new Error('Administrator account has no password set.');
          }
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (isPasswordValid) {
            // Admin login successful
            return {
              id: (user._id as any).toString(),
              email: user.email,
              role: user.role,
              status: user.status,
              name: user.name,
              image: user.image,
              referralCodeUsed: user.referralCodeUsed, // Will be undefined for admin unless set
              referralExpiresAt: user.referralExpiresAt, // Will be undefined for admin unless set
            };
          } else {
            throw new Error('Invalid email or password.');
          }
        }
        // --- End Admin Login Logic ---

        // --- Regular User Login Logic (Email + Referral Code) ---
        if (!credentials.referralCode) {
          throw new Error('Referral Code is required for non-admin login.');
        }

        // Check user status for regular users
        if (user.status === 'Pending') {
          // FIX: Removed the extra 'new' keyword
          throw new Error('Account is pending approval. Please wait for an administrator to approve your request.');
        }
        if (user.status === 'Rejected') {
          throw new Error('Your account has been rejected. Please contact support.');
        }

        // Validate referral code for regular users
        if (!user.referralCodeUsed || user.referralCodeUsed !== credentials.referralCode) {
          throw new Error('Invalid email or referral code.');
        }

        // Check referral code expiry for regular users
        if (user.referralExpiresAt && user.referralExpiresAt < new Date()) {
          throw new Error('Referral code expired.');
        }

        // Regular user login successful
        return {
          id: (user._id as any).toString(),
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET!,
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }: { token: import('next-auth/jwt').JWT; user: NextAuthUser | undefined }) {
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
    async session({ session, token }: { session: Session; token: import('next-auth/jwt').JWT }) {
      if (session.user && token) {
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
