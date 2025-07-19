// src/app/jobs/manage/[id]/applicants/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IUser } from '@/models/User'; // Import IUser for applicant typing
import { FiUsers, FiBriefcase, FiUser, FiMail, FiFileText, FiArrowLeft, FiXCircle } from 'react-icons/fi'; // Import icons

interface ApplicantsPageProps {
  params: {
    id: string; // Job ID from the URL
  };
}

export default function JobApplicantsPage({ params }: ApplicantsPageProps) {
  const { id: jobId } = params;

  const { data: session, status } = useSession();
  const router = useRouter();

  const [applicants, setApplicants] = useState<IUser[]>([]);
  const [jobTitle, setJobTitle] = useState(''); // To display the job title
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplicants = useCallback(async () => {
    if (status === 'loading') return;

    // Redirect if unauthenticated OR if authenticated but user status is not 'Approved'
    if (status === 'unauthenticated' || (session && session.user.status !== 'Approved')) {
      router.push('/login?error=AccessDenied'); // Redirect non-authorized/unapproved users
      return;
    }

    // Also check for role here for client-side rendering logic, though middleware also protects
    if (session && !['Job Poster', 'Administrator'].includes(session.user.role)) {
      setError('You do not have permission to view this page.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // First, fetch job details to get the title
      const jobResponse = await fetch(`/api/jobs/${jobId}`);
      if (!jobResponse.ok) {
        const errorText = await jobResponse.text();
        console.error('Job Title API Error Response Text:', errorText);
        throw new Error(`Failed to fetch job title: ${jobResponse.status} ${jobResponse.statusText}. Details: ${errorText.substring(0, 100)}...`);
      }
      const jobData = await jobResponse.json();
      setJobTitle(jobData.jobPost.title);

      // Then, fetch applicants for that job
      const applicantsResponse = await fetch(`/api/jobs/${jobId}/applicants`);
      if (!applicantsResponse.ok) {
        const errorText = await applicantsResponse.text();
        console.error('Applicants API Error Response Text:', errorText);
        throw new Error(`Failed to fetch applicants: ${applicantsResponse.status} ${applicantsResponse.statusText}. Details: ${errorText.substring(0, 100)}...`);
      }
      const applicantsData = await applicantsResponse.json();

      setApplicants(applicantsData.applicants);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while fetching applicants.');
      console.error('Fetch Applicants Error:', err);
    } finally {
      setLoading(false);
    }
  }, [session, status, router, jobId]);

  useEffect(() => {
    if (jobId && status !== 'loading') { // Only fetch if jobId is available and session status is not loading
      fetchApplicants();
    }
  }, [jobId, status, fetchApplicants]); // Add status to dependencies to re-trigger on session change


  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="inline-block h-12 w-12 border-4 border-[#741ee3] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If unauthenticated or not approved, redirect already handled by useEffect
  if (status === 'unauthenticated' || (session && session.user.status !== 'Approved')) {
    return null;
  }

  // If role is insufficient, show error message
  if (session && !['Job Poster', 'Administrator'].includes(session.user.role)) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="bg-purple-50 border border-purple-200 text-purple-700 px-4 py-3 rounded-lg relative max-w-md w-full" role="alert">
          <strong className="font-bold flex items-center"><FiXCircle className="mr-2" /> Access Denied!</strong>
          <span className="block sm:inline"> You do not have permission to view this page.</span>
          <p className="text-sm mt-2">
            <Link href="/" className="text-purple-800 hover:underline inline-flex items-center">
              <FiArrowLeft className="mr-1" /> Go to Home
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="bg-purple-50 border border-purple-200 text-purple-700 px-4 py-3 rounded-lg relative max-w-md w-full" role="alert">
          <strong className="font-bold flex items-center"><FiXCircle className="mr-2" /> Error!</strong>
          <span className="block sm:inline"> {error}</span>
          <p className="text-sm mt-2">Please ensure you have permission to view this job's applicants.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-8 sm:pt-20 sm:pb-12"> {/* Added pt for navbar clearance */}
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header Section */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-[#741ee3] to-[#9a4dff] text-white">
          <div className="flex items-center">
            <FiUsers className="h-12 w-12 mr-4 text-white opacity-90" />
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">Applicants for "{jobTitle}"</h1>
          </div>
          <p className="text-sm sm:text-base opacity-90 mt-2">Review candidates who have applied to this job posting.</p>
        </div>

        {/* Applicants List */}
        <div className="p-6 sm:p-8">
          {applicants.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg shadow-inner">
              <FiUsers className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">No applicants found for this job yet.</p>
              <p className="text-gray-500 text-sm mt-2">Share your job post to attract more candidates!</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center"><FiUser className="mr-1.5" /> Applicant Name</div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center"><FiMail className="mr-1.5" /> Email</div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center"><FiBriefcase className="mr-1.5" /> Role</div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center justify-end"><FiFileText className="mr-1.5" /> Resume</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applicants.map((applicant) => (
                    <tr key={(applicant._id as any).toString()} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {applicant.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {applicant.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {applicant.role}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {applicant.resumeUrl ? (
                          <a
                            href={applicant.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-[#741ee3] hover:bg-[#5a16b5] transition-all transform hover:scale-105"
                          >
                            <FiFileText className="mr-1.5 h-3.5 w-3.5" /> View Resume
                          </a>
                        ) : (
                          <span className="text-gray-500 px-3 py-1.5 rounded-md bg-gray-100">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="mt-8 text-center pb-6">
          <Link href="/jobs/manage" className="inline-flex items-center text-[#741ee3] hover:text-[#5a16b5] font-medium transition-colors">
            <FiArrowLeft className="mr-2 h-5 w-5" /> Back to Manage Jobs
          </Link>
        </div>
      </div>
    </div>
  );
}
