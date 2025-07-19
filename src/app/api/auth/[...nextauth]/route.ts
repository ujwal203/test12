import NextAuth from 'next-auth';
import { authOptions as baseOptions } from '@/lib/authOptions';

export const authOptions = baseOptions; // ✅ Add this line

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
