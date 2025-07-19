// src/app/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  FiUser, FiLogIn, FiUserPlus, FiBriefcase, FiPlusCircle,
  FiSettings, FiUsers, FiLayers, FiAward, FiSearch
} from 'react-icons/fi';

export default function Home() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 border-4 border-[#741ee3] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-medium text-purple-800">Getting things ready...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="relative z-10 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
              Welcome to <span className="text-[#741ee3]">Udyog Jagat</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              {status === 'unauthenticated'
                ? "Your gateway to career opportunities and talent acquisition"
                : `Ready to explore, ${session!.user?.name?.split(' ')[0] || 'Member'}?`}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24 -mt-10">
        {status === 'unauthenticated' ? (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto">
            <div className="p-8 sm:p-10 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-[#741ee3]/10 mb-6">
                <FiUser className="h-8 w-8 text-[#741ee3]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Join Our Professional Network
              </h2>
              <p className="text-gray-500 mb-8">
                Sign in to access job opportunities, post listings, or manage referrals in our growing community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login" className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#741ee3] to-[#9a4dff] rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
                  <div className="relative px-6 py-3 bg-white ring-1 ring-gray-900/5 rounded-lg leading-none flex items-center justify-center gap-2 font-semibold text-[#741ee3] hover:text-[#5a16b5] transition-colors">
                    <FiLogIn className="h-5 w-5" />
                    Login
                  </div>
                </Link>

                <Link href="/register" className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#741ee3] to-[#9a4dff] rounded-lg blur opacity-0 group-hover:opacity-75 transition duration-200"></div>
                  <div className="relative px-6 py-3 bg-gradient-to-r from-[#741ee3] to-[#9a4dff] text-white rounded-lg leading-none flex items-center justify-center gap-2 font-semibold hover:from-[#5a16b5] hover:to-[#741ee3] transition-colors">
                    <FiUserPlus className="h-5 w-5" />
                    Register
                  </div>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-8">
            {/* Welcome Card */}
            <div className="bg-gradient-to-r from-[#741ee3] to-[#9a4dff] rounded-2xl shadow-xl text-white overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Welcome back, {session!.user?.name?.split(' ')[0] || 'Member'}!</h2>
                    <p className="opacity-90">Ready to explore opportunities on Udyog Jagat?</p>
                  </div>
                  <div className="mt-4 md:mt-0 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 inline-flex items-center">
                    <span className="font-medium capitalize">{session!.user?.role}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <ActionCard
                title="My Profile"
                description="View and edit your profile"
                icon={<FiUser className="h-6 w-6" />}
                href="/profile"
                color="from-[#741ee3] to-[#9a4dff]"
              />

              {/* Role-specific cards */}
              {session!.user?.role === 'Job Seeker' && (
                <>
                  <ActionCard
                    title="Find Jobs"
                    description="Browse available opportunities"
                    icon={<FiSearch className="h-6 w-6" />}
                    href="/jobs/find"
                    color="from-purple-500 to-indigo-500"
                  />
                  <ActionCard
                    title="My Applications"
                    description="Track your job applications"
                    icon={<FiBriefcase className="h-6 w-6" />}
                    href="/jobs/applied"
                    color="from-blue-500 to-purple-500"
                  />
                </>
              )}

              {session!.user?.role === 'Job Poster' && (
                <>
                  <ActionCard
                    title="Post a Job"
                    description="Create new job listing"
                    icon={<FiPlusCircle className="h-6 w-6" />}
                    href="/jobs/post"
                    color="from-emerald-500 to-teal-500"
                  />
                  <ActionCard
                    title="Manage Jobs"
                    description="View and edit your listings"
                    icon={<FiLayers className="h-6 w-6" />}
                    href="/jobs/manage"
                    color="from-cyan-500 to-blue-500"
                  />
                </>
              )}

              {session!.user?.role === 'Referrer' && (
                <>
                  <ActionCard
                    title="Generate Code"
                    description="Create referral codes"
                    icon={<FiAward className="h-6 w-6" />}
                    href="/referrals/generate"
                    color="from-pink-500 to-rose-500"
                  />
                  <ActionCard
                    title="My Referrals"
                    description="Track your referrals"
                    icon={<FiUsers className="h-6 w-6" />}
                    href="/referrals/manage"
                    color="from-orange-500 to-amber-500"
                  />
                </>
              )}

              {session!.user?.role === 'Administrator' && (
                <>
                  <ActionCard
                    title="Manage Users"
                    description="Approve referral requests"
                    icon={<FiUsers className="h-6 w-6" />}
                    href="/admin/users"
                    color="from-yellow-500 to-amber-500"
                  />
                  <ActionCard
                    title="Manage All Jobs"
                    description="All job listings"
                    icon={<FiBriefcase className="h-6 w-6" />}
                    href="/jobs/manage"
                    color="from-green-500 to-emerald-500"
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Reusable Action Card Component
function ActionCard({
  title,
  description,
  icon,
  href,
  color,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}) {
  return (
    <Link href={href} className="group">
      <div className="h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:border-transparent">
        <div className="p-6">
          <div className={`flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-r ${color} mb-4 text-white`}>
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-[#741ee3] transition-colors">{title}</h3>
          <p className="text-gray-500 text-sm">{description}</p>
        </div>
        <div className="px-6 pb-4">
          <span className="inline-flex items-center text-sm font-medium text-[#741ee3] group-hover:underline">
            Get started
            <svg className="ml-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
