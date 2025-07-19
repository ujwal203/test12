// src/types/next-auth.d.ts

import { DefaultSession } from 'next-auth';

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

declare module 'next-auth/adapters' {
  interface AdapterUser {
    role: 'Guest' | 'Job Seeker' | 'Job Poster' | 'Referrer' | 'Administrator';
    status: 'Pending' | 'Approved' | 'Rejected';
    referralCodeUsed?: string;
    referralExpiresAt?: Date;
  }
}
