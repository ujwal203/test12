// src/middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { IUser } from '@/models/User';

// Define your user roles
type UserRole = 'Guest' | 'Job Seeker' | 'Job Poster' | 'Referrer' | 'Administrator';

// Define paths that require authentication and their allowed roles
const protectedRoutes: { [key: string]: UserRole[] } = {
  '/jobs/find': ['Job Seeker', 'Job Poster', 'Referrer', 'Administrator'],
  '/jobs/post': ['Job Poster', 'Administrator'],
  '/jobs/manage': ['Job Poster', 'Administrator'],
  '/jobs/my-posts': ['Job Seeker'],
  '/profiles/matching': ['Job Poster', 'Administrator'],
  '/profile': ['Job Seeker', 'Job Poster', 'Referrer', 'Administrator'],
  '/referrals/generate': ['Referrer', 'Administrator'],
  '/admin/companies': ['Administrator'],
  '/admin/users': ['Administrator'], // NEW: For admin user management page
  '/api/register': ['Guest'],
  '/api/test-db': ['Administrator'],
  '/api/jobs': ['Job Seeker', 'Job Poster', 'Administrator'],
  '/api/users': ['Administrator'], // NEW: For admin user management API
  '/api/referrals': ['Referrer', 'Administrator'],
  '/api/admin/approve-user': ['Administrator'], // NEW: Admin approval API
};

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const pathname = req.nextUrl.pathname;

    // Determine the user's role and status from the token
    const userRole: UserRole = (token?.role as UserRole) || 'Guest';
    const userStatus: IUser['status'] = (token?.status as IUser['status']) || 'Pending'; // Get status

    // Allow access to login, register, and their API routes without status check
    if (pathname === '/login' || pathname === '/register' || pathname === '/api/register') {
      return NextResponse.next();
    }

    // If authenticated, but account is pending or rejected, redirect to login with error
    if (token && userStatus !== 'Approved') {
      console.warn(`User ${token.email} account status is ${userStatus}. Redirecting to login.`);
      return NextResponse.redirect(new URL(`/login?error=AccessDenied&status=${userStatus}`, req.url));
    }

    // Check if the requested path is a protected route
    const requiredRoles = protectedRoutes[pathname];

    if (requiredRoles) {
      // If the route is protected and the user is a Guest (unauthenticated)
      // This check is mostly for routes not covered by the `token && userStatus !== 'Approved'` above
      if (userRole === 'Guest') {
        return NextResponse.redirect(new URL('/login', req.url));
      }

      // If the route is protected and the user's role is not allowed
      if (!requiredRoles.includes(userRole)) {
        console.warn(`Access Denied: User ${token?.email} (Role: ${userRole}) tried to access ${pathname}`);
        return NextResponse.redirect(new URL('/', req.url)); // Redirect to home
      }

      // Special handling for referral expiry for authenticated, approved users
      if (userStatus === 'Approved' && token?.referralExpiresAt) {
        const expiryDate = new Date(token.referralExpiresAt);
        if (expiryDate < new Date()) {
          console.warn(`User ${token.email} access expired. Redirecting to login.`);
          return NextResponse.redirect(new URL('/login?error=ReferralExpired', req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      async authorized({ token, req }) {
        // This callback is primarily for `withAuth` to decide if the middleware function runs.
        // We've moved granular role/status checks into the middleware function itself.
        // Here, we just ensure a token exists for most routes,
        // allowing login/register/api/register for everyone.

        const pathname = req.nextUrl.pathname;

        if (pathname === '/login' || pathname === '/register' || pathname === '/api/register') {
          return true; // Allow these pages/APIs for everyone
        }

        // For all other routes, a token must exist to proceed to the middleware function
        return !!token;
      },
    },
    pages: {
      signIn: '/login', // Default redirect for unauthorized access if `authorized` returns false
    },
  }
);

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|vercel.svg|.*\\..*).*)',
    '/api/register', // Explicitly include for guest access
    '/api/test-db', // Explicitly include for admin access
    '/api/admin/approve-user', // Explicitly include for admin access
    '/api/users', // Explicitly include for admin access
    '/jobs/:path*',
    '/profiles/:path*',
    '/profile',
    '/referrals/:path*',
    '/admin/:path*',
  ],
};
