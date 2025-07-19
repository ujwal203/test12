// src/app/components/Navbar.tsx
'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiMenu, FiX, FiBriefcase, FiUser, FiPlusCircle, FiUsers, FiShare2, FiSettings, FiLogOut, FiHome } from 'react-icons/fi'; // Import icons

export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <nav className="bg-white shadow-lg fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-3xl font-extrabold text-[#741ee3] tracking-tight">
                Udyog Jagat
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-8">
            {status === 'loading' && (
              <div className="animate-pulse h-5 w-20 bg-gray-200 rounded"></div>
            )}

            {status === 'unauthenticated' && (
              <>
                <Link 
                  href="/login" 
                  className="text-gray-700 hover:text-[#741ee3] px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link 
                  href="/register" 
                  className="bg-gradient-to-r from-[#741ee3] to-[#9a4dff] hover:from-[#5a16b5] hover:to-[#741ee3] text-white px-4 py-2 rounded-md text-sm font-medium transition-all shadow-md transform hover:scale-105"
                >
                  Register
                </Link>
              </>
            )}

            {status === 'authenticated' && (
              <>
                {/* Links for Job Seeker */}
                {session?.user?.role === 'Job Seeker' && (
                  <>
                    <Link 
                      href="/jobs/find" 
                      className="text-gray-700 hover:text-[#741ee3] px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                    >
                      <FiBriefcase className="mr-1.5" /> Find Jobs
                    </Link>
                    <Link 
                      href="/profile" 
                      className="text-gray-700 hover:text-[#741ee3] px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                    >
                      <FiUser className="mr-1.5" /> Profile
                    </Link>
                  </>
                )}

                {/* Links for Job Poster */}
                {session?.user?.role === 'Job Poster' && (
                  <>
                    <Link 
                      href="/jobs/post" 
                      className="text-gray-700 hover:text-[#741ee3] px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                    >
                      <FiPlusCircle className="mr-1.5" /> Post Job
                    </Link>
                    <Link 
                      href="/jobs/manage" 
                      className="text-gray-700 hover:text-[#741ee3] px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                    >
                      <FiBriefcase className="mr-1.5" /> Manage Jobs
                    </Link>
                    <Link 
                      href="/profile" 
                      className="text-gray-700 hover:text-[#741ee3] px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                    >
                      <FiUser className="mr-1.5" /> Profile
                    </Link>
                  </>
                )}

                {/* Links for Referrer */}
                {session?.user?.role === 'Referrer' && (
                  <>
                    <Link 
                      href="/referrals/generate" 
                      className="text-gray-700 hover:text-[#741ee3] px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                    >
                      <FiShare2 className="mr-1.5" /> Generate Referral
                    </Link>
                    <Link 
                      href="/profile" 
                      className="text-gray-700 hover:text-[#741ee3] px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                    >
                      <FiUser className="mr-1.5" /> Profile
                    </Link>
                  </>
                )}

                {/* Links for Administrator */}
                {session?.user?.role === 'Administrator' && (
                  <>
                    <div className="relative group">
                      <button className="text-gray-700 hover:text-[#741ee3] px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center">
                        Admin
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="py-1">
                          <Link href="/" className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-[#741ee3] flex items-center"><FiHome className="mr-2" /> Dashboard</Link>
                          <Link href="/admin/users" className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-[#741ee3] flex items-center"><FiUsers className="mr-2" /> Manage Users</Link>
                          <Link href="/jobs/manage" className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-[#741ee3] flex items-center"><FiBriefcase className="mr-2" /> Manage All Jobs</Link>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* User dropdown */}
                <div className="ml-4 relative flex items-center">
                  <div className="relative group">
                    <button className="flex items-center space-x-2 focus:outline-none">
                      <div className="h-8 w-8 rounded-full bg-purple-100 text-[#741ee3] flex items-center justify-center font-medium">
                        {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0)}
                      </div>
                      <span className="text-gray-700 font-medium hidden lg:inline">
                        {session?.user?.name || session?.user?.email?.split('@')[0]}
                      </span>
                    </button>
                    <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="py-1">
                        <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-[#741ee3] flex items-center"><FiUser className="mr-2" /> Your Profile</Link>
                        {/* <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-[#741ee3] flex items-center"><FiSettings className="mr-2" /> Settings</Link> */}
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-[#741ee3] flex items-center"
                        >
                          <FiLogOut className="mr-2" /> Sign out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <FiX className="block h-6 w-6" />
              ) : (
                <FiMenu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="pt-2 pb-3 space-y-1 bg-white shadow-lg">
          {status === 'unauthenticated' && (
            <>
              <Link 
                href="/login" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#741ee3] hover:bg-purple-50"
              >
                Login
              </Link>
              <Link 
                href="/register" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-white bg-gradient-to-r from-[#741ee3] to-[#9a4dff] hover:from-[#5a16b5] hover:to-[#741ee3]"
              >
                Register
              </Link>
            </>
          )}

          {status === 'authenticated' && (
            <>
              {/* Mobile links for Job Seeker */}
              {session?.user?.role === 'Job Seeker' && (
                <>
                  <Link 
                    href="/jobs/find" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#741ee3] hover:bg-purple-50 flex items-center"
                  >
                    <FiBriefcase className="mr-2" /> Find Jobs
                  </Link>
                  <Link 
                    href="/profile" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#741ee3] hover:bg-purple-50 flex items-center"
                  >
                    <FiUser className="mr-2" /> Profile
                  </Link>
                </>
              )}

              {/* Mobile links for Job Poster */}
              {session?.user?.role === 'Job Poster' && (
                <>
                  <Link 
                    href="/jobs/post" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#741ee3] hover:bg-purple-50 flex items-center"
                  >
                    <FiPlusCircle className="mr-2" /> Post Job
                  </Link>
                  <Link 
                    href="/jobs/manage" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#741ee3] hover:bg-purple-50 flex items-center"
                  >
                    <FiBriefcase className="mr-2" /> Manage Jobs
                  </Link>
                  <Link 
                    href="/profile" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#741ee3] hover:bg-purple-50 flex items-center"
                  >
                    <FiUser className="mr-2" /> Profile
                  </Link>
                </>
              )}

              {/* Mobile links for Referrer */}
              {session?.user?.role === 'Referrer' && (
                <>
                  <Link 
                    href="/referrals/generate" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#741ee3] hover:bg-purple-50 flex items-center"
                  >
                    <FiShare2 className="mr-2" /> Generate Referral
                  </Link>
                  <Link 
                    href="/profile" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#741ee3] hover:bg-purple-50 flex items-center"
                  >
                    <FiUser className="mr-2" /> Profile
                  </Link>
                </>
              )}

              {/* Mobile links for Administrator */}
              {session?.user?.role === 'Administrator' && (
                <>
                  <Link 
                    href="/" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#741ee3] hover:bg-purple-50 flex items-center"
                  >
                    <FiHome className="mr-2" /> Admin Dashboard
                  </Link>
                  <Link 
                    href="/admin/users" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#741ee3] hover:bg-purple-50 flex items-center"
                  >
                    <FiUsers className="mr-2" /> Manage Users
                  </Link>
                  <Link 
                    href="/jobs/manage" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#741ee3] hover:bg-purple-50 flex items-center"
                  >
                    <FiBriefcase className="mr-2" /> Manage All Jobs
                  </Link>
                </>
              )}

              <div className="pt-4 pb-2 border-t border-gray-200">
                <div className="flex items-center px-5">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-purple-100 text-[#741ee3] flex items-center justify-center font-medium">
                      {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0)}
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">
                      {session?.user?.name || session?.user?.email}
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      {session?.user?.role}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1 px-2">
                  <Link 
                    href="/profile" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#741ee3] hover:bg-purple-50 flex items-center"
                  >
                    <FiUser className="mr-2" /> Your Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#741ee3] hover:bg-purple-50 flex items-center"
                  >
                    <FiLogOut className="mr-2" /> Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
