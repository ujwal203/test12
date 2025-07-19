// src/app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IUser } from '@/models/User'; // Import IUser for typing
import { FiUser, FiMail, FiUpload, FiFileText, FiCheckCircle, FiXCircle, FiCalendar, FiCode, FiArrowLeft } from 'react-icons/fi'; // Added icons

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession(); // Get update function for session
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states for profile update
  const [name, setName] = useState('');
  const [image, setImage] = useState(''); // Placeholder for image URL

  // Form states for resume upload
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeUploadError, setResumeUploadError] = useState<string | null>(null);
  const [resumeUploadSuccess, setResumeUploadSuccess] = useState<string | null>(null);


  useEffect(() => {
    const fetchProfile = async () => {
      if (status === 'loading') return;

      if (status === 'unauthenticated' || (session && !['Job Seeker', 'Job Poster', 'Referrer', 'Administrator'].includes(session.user.role))) {
        router.push('/login'); // Redirect if not authenticated or unauthorized
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/profile');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch profile');
        }

        setUserProfile(data.user);
        setName(data.user.name || '');
        setImage(data.user.image || '');
        // Initialize other profile fields here if you add them
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred while fetching profile.');
        console.error('Fetch Profile Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [session, status, router]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // Reuse loading for form submission
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, image /* other fields */ }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
      setUserProfile(data.user); // Update local state with fresh data
      updateSession(); // Force NextAuth session to re-fetch and update client-side session
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while updating profile.');
      console.error('Profile Update Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
      setResumeUploadError(null);
      setResumeUploadSuccess(null);
    }
  };

  const handleResumeUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) {
      setResumeUploadError('Please select a file to upload.');
      return;
    }

    setUploadingResume(true);
    setResumeUploadError(null);
    setResumeUploadSuccess(null);

    const formData = new FormData();
    formData.append('resume', resumeFile); // 'resume' must match the field name in API route

    try {
      const response = await fetch('/api/profile/upload-resume', {
        method: 'POST',
        body: formData, // No 'Content-Type' header needed for FormData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload resume');
      }

      setResumeUploadSuccess('Resume uploaded successfully!');
      // FIX: Explicitly cast the updated user object to IUser
      setUserProfile(prev => prev ? { ...prev, resumeUrl: data.resumeUrl as string } as IUser : null); // Update resumeUrl in state and cast
      setResumeFile(null); // Clear selected file
      // Optionally, clear the file input element
      const fileInput = document.getElementById('resumeFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      updateSession(); // Force NextAuth session to re-fetch and update client-side session
    } catch (err: any) {
      setResumeUploadError(err.message || 'An unexpected error occurred during resume upload.');
      console.error('Resume Upload Error:', err);
    } finally {
      setUploadingResume(false);
    }
  };


  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="inline-block h-12 w-12 border-4 border-[#741ee3] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (status === 'unauthenticated' || (session && !['Job Seeker', 'Job Poster', 'Referrer', 'Administrator'].includes(session.user.role))) {
    return null; // Redirect handled by useEffect
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md w-full" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
          <p className="text-sm mt-2">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative max-w-md w-full" role="alert">
          <strong className="font-bold">Profile Not Found!</strong>
          <span className="block sm:inline"> Your user profile could not be loaded.</span>
          <p className="text-sm mt-2">Please contact support if this issue persists.</p>
        </div>
      </div>
    );
  }

  const isExpired = userProfile.referralExpiresAt && new Date(userProfile.referralExpiresAt) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-8 sm:pt-20 sm:pb-12"> {/* Added pt for navbar clearance */}
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        
        {/* Profile Header Section */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-[#741ee3] to-[#9a4dff] text-white">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0 h-20 w-20 rounded-full bg-white flex items-center justify-center text-[#741ee3] shadow-lg overflow-hidden">
              {userProfile.image ? (
                <img src={userProfile.image} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <FiUser className="h-12 w-12" />
              )}
            </div>
            <div className="ml-4">
              <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">{userProfile.name || 'User Profile'}</h1>
              <p className="text-lg sm:text-xl font-medium opacity-90 mt-1">
                {userProfile.email}
              </p>
              <p className="text-sm sm:text-base font-semibold opacity-80 mt-1">
                Role: {userProfile.role}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Details and Forms Section */}
        <div className="p-6 sm:p-8">
          {/* Messages for success/error */}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
              <span className="block sm:inline">{success}</span>
            </div>
          )}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Basic Information Section */}
          <section className="mb-8 border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Basic Information</h2>
            <form onSubmit={handleProfileUpdate} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-[#741ee3] focus:border-transparent text-base placeholder-gray-400"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-base"
                    value={userProfile.email}
                    disabled // Email is typically not editable
                  />
                </div>
              </div>
              {/* Add more profile fields here (e.g., bio, contact number) */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center py-3 px-6 border border-transparent shadow-lg text-base font-medium rounded-lg text-white bg-gradient-to-r from-[#741ee3] to-[#9a4dff] hover:from-[#5a16b5] hover:to-[#741ee3] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#741ee3] transform hover:scale-105"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </section>

          {/* Resume Upload Section (Only for Job Seekers and Admins) */}
          {['Job Seeker', 'Administrator'].includes(userProfile.role) && (
            <section className="mb-8 border-b border-gray-200 pb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Resume Management</h2>
              {resumeUploadError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                  <span className="block sm:inline">{resumeUploadError}</span>
                </div>
              )}
              {resumeUploadSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                  <span className="block sm:inline">{resumeUploadSuccess}</span>
                </div>
              )}

              {userProfile.resumeUrl ? (
                <div className="mb-4 flex items-center justify-between bg-gray-50 p-4 rounded-lg shadow-sm">
                  <p className="text-gray-700 flex items-center">
                    <FiFileText className="mr-3 h-6 w-6 text-blue-600" />
                    Current Resume:
                  </p>
                  <a href={userProfile.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center font-medium">
                    View <FiArrowLeft className="ml-1 rotate-180" />
                  </a>
                </div>
              ) : (
                <p className="text-gray-700 mb-4">No resume uploaded yet.</p>
              )}

              <form onSubmit={handleResumeUpload} className="space-y-5">
                <div>
                  <label htmlFor="resumeFile" className="block text-sm font-semibold text-gray-700 mb-2">Upload New Resume (PDF, DOCX - Max 5MB)</label>
                  <input
                    type="file"
                    id="resumeFile"
                    accept=".pdf,.doc,.docx" // Restrict file types
                    className="mt-1 block w-full text-sm text-gray-500
                               file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0
                               file:text-sm file:font-semibold file:bg-blue-50 file:text-[#741ee3]
                               hover:file:bg-blue-100 transition-colors duration-200"
                    onChange={handleResumeFileChange}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center py-3 px-6 border border-transparent shadow-lg text-base font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300 transform hover:scale-105"
                    disabled={uploadingResume || !resumeFile}
                  >
                    {uploadingResume ? 'Uploading...' : <><FiUpload className="mr-2" /> Upload Resume</>}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Referral Status Section (Only for Job Seekers) */}
          {userProfile.role === 'Job Seeker' && (
            <section className="mb-8 pb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Referral Access Status</h2>
              <div className="bg-gray-50 p-5 rounded-lg shadow-sm space-y-3">
                <p className="text-gray-700 flex items-center">
                  <FiCalendar className="mr-3 h-5 w-5 text-gray-600" />
                  Your account status: <span className={`ml-2 font-semibold ${
                    userProfile.status === 'Approved' ? 'text-green-600' :
                    userProfile.status === 'Pending' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {userProfile.status}
                  </span>
                </p>
                {userProfile.referralExpiresAt ? (
                  <p className="text-gray-700 flex items-center">
                    {isExpired ? (
                      <FiXCircle className="mr-3 h-5 w-5 text-red-600" />
                    ) : (
                      <FiCheckCircle className="mr-3 h-5 w-5 text-green-600" />
                    )}
                    Access valid until:{' '}
                    <span className={`font-medium ml-1 ${isExpired ? 'text-red-600' : 'text-gray-800'}`}>
                      {new Date(userProfile.referralExpiresAt).toLocaleDateString()}
                    </span>
                    {isExpired && (
                      <span className="text-red-600 font-bold ml-2">(Expired!)</span>
                    )}
                  </p>
                ) : (
                  <p className="text-gray-700 flex items-center">
                    <FiCalendar className="mr-3 h-5 w-5 text-gray-400" />
                    No referral expiry date found.
                  </p>
                )}
                {userProfile.referralCodeUsed && (
                  <p className="text-gray-700 text-sm mt-1 flex items-center">
                    <FiCode className="mr-3 h-5 w-5 text-gray-600" />
                    Referral Code Used: <span className="font-mono bg-gray-200 px-2 py-1 rounded text-gray-800 ml-1">{userProfile.referralCodeUsed}</span>
                  </p>
                )}
                {isExpired && userProfile.role === 'Job Seeker' && (
                  <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg shadow-md">
                    <p className="font-semibold">Your access has expired.</p>
                    <p className="text-sm mt-1">Please obtain a new referral code to reactivate your account and continue using Udyog Jagat.</p>
                    {/* Link to a page for requesting new referral code, or contact referrer */}
                  </div>
                )}
              </div>
            </section>
          )}

          <div className="mt-8 text-center">
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors">
              <FiArrowLeft className="mr-2 h-5 w-5" /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
