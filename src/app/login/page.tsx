'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const session = useSession();
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlError = searchParams.get('error');
    const statusParam = searchParams.get('status');

    if (urlError === 'ReferralExpired') {
      setError('Your access has expired. Please obtain a new referral code or contact support.');
    } else if (urlError === 'AccessDenied' && statusParam === 'Pending') {
      setError('Your account is pending approval. Please wait for an administrator to approve your request.');
    } else if (urlError === 'AccessDenied' && statusParam === 'Rejected') {
      setError('Your account has been rejected. Please contact support.');
    } else if (urlError) {
      setError('An authentication error occurred. Please try again.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (session.status === 'authenticated') {
      router.push('/');
    }
  }, [session.status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let credentials: { email: string; password?: string; referralCode?: string };

    if (email === 'admin@admin.com') {
      credentials = { email, password };
    } else {
      credentials = { email, referralCode };
    }

    const result = await signIn('credentials', {
      redirect: false,
      ...credentials,
    });

    if (result?.error) {
      if (result.error === 'CredentialsSignin') {
        setError('Invalid email, password, or referral code.');
      } else if (result.error.includes('Referral code expired')) {
        setError('Your referral access has expired. Please obtain a new referral code.');
      } else if (result.error.includes('pending') || result.error.includes('not approved')) {
        setError('Your account is pending approval. Please wait for an administrator to approve your request.');
      } else if (result.error.includes('rejected')) {
        setError('Your account has been rejected. Please contact support.');
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
      console.error('Login Error:', result.error);
    } else if (result?.ok) {
      router.push('/');
    }
    setLoading(false);
  };

  if (session.status === 'loading' || session.status === 'authenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-[#741EE3] h-12 w-12"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-[#741EE3] to-[#9D5CFF] p-6 text-white text-center">
            <h2 className="text-3xl font-bold">Welcome Back</h2>
            <p className="opacity-90 mt-1">Sign in to your account</p>
          </div>
          
          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border-l-4 border-red-500 flex items-start">
                <svg className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#741EE3] focus:border-[#741EE3] transition-all placeholder-gray-400"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                </div>
              </div>

              {email === 'admin@admin.com' ? (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      id="password"
                      className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#741EE3] focus:border-[#741EE3] transition-all placeholder-gray-400"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Referral Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="referralCode"
                      className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#741EE3] focus:border-[#741EE3] transition-all placeholder-gray-400"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      required
                      placeholder="Enter your referral code"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6.625 2.655A9 9 0 0119 11a1 1 0 11-2 0 7 7 0 00-9.625-6.492 1 1 0 11-.75-1.853zM4.662 4.959A1 1 0 014.75 6.37 6.97 6.97 0 003 11a1 1 0 11-2 0 8.97 8.97 0 012.25-5.953 1 1 0 011.412-.088z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M5 11a5 5 0 1110 0 1 1 0 11-2 0 3 3 0 10-6 0c0 1.677-.345 3.276-.968 4.729a1 1 0 11-1.838-.789A9.964 9.964 0 005 11zm8.921 2.012a1 1 0 01.831 1.145 19.86 19.86 0 01-.545 2.436 1 1 0 11-1.92-.558c.207-.713.371-1.445.49-2.192a1 1 0 011.144-.83z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M10 10a1 1 0 011 1c0 2.236-.46 4.368-1.29 6.304a1 1 0 01-1.838-.789A13.952 13.952 0 009 11a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center items-center py-3 px-4 rounded-lg transition-all ${loading ? 'bg-[#9D5CFF]' : 'bg-gradient-to-r from-[#741EE3] to-[#9D5CFF] hover:from-[#5A17B5] hover:to-[#741EE3]'} text-white font-medium shadow-md hover:shadow-lg`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/register" className="font-medium text-[#741EE3] hover:text-[#5A17B5] transition-colors">
                  Register here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}