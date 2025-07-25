// src/app/jobs/[id]/JobDetailsClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiMapPin, FiBriefcase, FiAward, FiDollarSign, FiClock, FiGlobe, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { IJobPost } from '@/models/JobPost';
import { ICompany } from '@/models/Company';

interface PopulatedJobPost extends Omit<IJobPost, 'company' | 'postedBy' | 'applicants'> {
  company: ICompany;
  postedBy: { _id: string; name: string; email: string };
  applicants: { _id: string; name: string; email: string }[];
}

// The component now accepts a simple `id` string prop
interface JobDetailsClientProps {
  id: string;
}

export default function JobDetailsClient({ id }: JobDetailsClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [jobPost, setJobPost] = useState<PopulatedJobPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (status === 'loading') return;
      if (status === 'unauthenticated' || (session && session.user.status !== 'Approved')) {
        router.push('/login?error=AccessDenied');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/jobs/${id}`);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response Text:', errorText);
          throw new Error(`Failed to fetch job details: ${response.status} ${response.statusText}.`);
        }
        const data = await response.json();
        const fetchedJob: PopulatedJobPost = data.jobPost;
        setJobPost(fetchedJob);

        if (session?.user?.id && Array.isArray(fetchedJob.applicants) && fetchedJob.applicants.some(applicant => applicant._id === session.user.id)) {
          setHasApplied(true);
        } else {
          setHasApplied(false);
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred while fetching job details.');
        console.error('Fetch Job Details Error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id && status !== 'loading') {
      fetchJobDetails();
    }
  }, [id, session, status, router]);

  const handleApply = async () => {
    if (!session || session.user.role !== 'Job Seeker') {
      setError('Only Job Seekers can apply for jobs.');
      return;
    }
    if (hasApplied) {
      setError('You have already applied for this job.');
      return;
    }

    setApplying(true);
    setError(null);
    setApplySuccess(null);

    try {
      const response = await fetch(`/api/jobs/${id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Apply API Error Response Text:', errorText);
        throw new Error(`Failed to submit application: ${response.status} ${response.statusText}.`);
      }

      setApplySuccess('Application submitted successfully!');
      setHasApplied(true);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while submitting application.');
      console.error('Apply Error:', err);
    } finally {
      setApplying(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="inline-block h-12 w-12 border-4 border-[#741ee3] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (status === 'unauthenticated' || (session && session.user.status !== 'Approved')) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md w-full" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
          <p className="text-sm mt-2">Please try navigating back or refreshing the page. If you are a pending user, please wait for admin approval.</p>
        </div>
      </div>
    );
  }

  if (!jobPost) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative max-w-md w-full" role="alert">
          <strong className="font-bold">Not Found!</strong>
          <span className="block sm:inline"> The job post you are looking for does not exist.</span>
          <p className="text-sm mt-2">
            <Link href="/jobs/find" className="text-yellow-800 hover:underline">
              Go back to Job Search
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const showApplyButton = session?.user?.role === 'Job Seeker' && !hasApplied;
  const showAppliedMessage = session?.user?.role === 'Job Seeker' && hasApplied;
  const showJobPosterMessage = (session?.user?.role === 'Job Poster' || session?.user?.role === 'Administrator') && jobPost.postedBy._id === session.user.id;
  const showAdminOrOtherJobPosterMessage = (session?.user?.role === 'Administrator' || session?.user?.role === 'Job Poster') && jobPost.postedBy._id !== session.user.id;

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-8 sm:pt-20 sm:pb-12">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-[#741ee3] to-[#9a4dff] text-white">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0 h-16 w-16 rounded-full bg-white flex items-center justify-center text-[#741ee3] shadow-lg">
              {jobPost.company?.logoUrl ? (
                <img src={jobPost.company.logoUrl} alt={jobPost.company.name} className="h-12 w-12 object-contain rounded-full" />
              ) : (
                <FiBriefcase className="h-9 w-9" />
              )}
            </div>
            <div className="ml-4">
              <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">{jobPost.title}</h1>
              <p className="text-lg sm:text-xl font-medium opacity-90 mt-1">{jobPost.company?.name || 'N/A'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm sm:text-base opacity-90">
            <div className="flex items-center">
              <FiMapPin className="mr-2 h-4 w-4" /> {jobPost.location}
            </div>
            {jobPost.company?.website && (
              <a href={jobPost.company.website} target="_blank" rel="noopener noreferrer" className="flex items-center hover:underline">
                <FiGlobe className="mr-2 h-4 w-4" /> Visit Company
              </a>
            )}
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-700 mb-8">
            <div className="flex items-center bg-gray-50 p-3 rounded-lg shadow-sm">
              <FiBriefcase className="mr-3 h-5 w-5 text-[#741ee3]" />
              <div>
                <p className="text-xs font-semibold text-gray-500">Job Type</p>
                <p className="font-medium">{jobPost.jobType}</p>
              </div>
            </div>
            <div className="flex items-center bg-gray-50 p-3 rounded-lg shadow-sm">
              <FiAward className="mr-3 h-5 w-5 text-[#741ee3]" />
              <div>
                <p className="text-xs font-semibold text-gray-500">Experience Level</p>
                <p className="font-medium">{jobPost.experienceLevel}</p>
              </div>
            </div>
            {jobPost.salaryRange && (
              <div className="flex items-center bg-gray-50 p-3 rounded-lg shadow-sm">
                <FiDollarSign className="mr-3 h-5 w-5 text-[#741ee3]" />
                <div>
                  <p className="text-xs font-semibold text-gray-500">Salary</p>
                  <p className="font-medium">{jobPost.salaryRange}</p>
                </div>
              </div>
            )}
            {jobPost.applicationDeadline && (
              <div className="flex items-center bg-gray-50 p-3 rounded-lg shadow-sm">
                <FiClock className="mr-3 h-5 w-5 text-[#741ee3]" />
                <div>
                  <p className="text-xs font-semibold text-gray-500">Deadline</p>
                  <p className="font-medium">{new Date(jobPost.applicationDeadline).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Description</h2>
          <p className="text-gray-700 leading-relaxed mb-8 whitespace-pre-line">{jobPost.description}</p>
          {jobPost.skillsRequired && jobPost.skillsRequired.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Skills Required</h2>
              <div className="flex flex-wrap gap-3">
                {jobPost.skillsRequired.map((skill, index) => (
                  <span key={index} className="bg-purple-100 text-[#741ee3] text-sm font-medium px-4 py-2 rounded-full shadow-sm">{skill}</span>
                ))}
              </div>
            </div>
          )}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {applySuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative w-full sm:w-auto text-center" role="alert">
                <span className="block">{applySuccess}</span>
              </div>
            )}
            {error && !applySuccess && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative w-full sm:w-auto text-center" role="alert">
                <span className="block">{error}</span>
              </div>
            )}
            {showApplyButton && (
              <button onClick={handleApply} className="w-full sm:w-auto flex items-center justify-center bg-gradient-to-r from-[#741ee3] to-[#9a4dff] hover:from-[#5a16b5] hover:to-[#741ee3] text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#741ee3] focus:ring-offset-2 transform hover:scale-105" disabled={applying}>
                {applying ? 'Applying...' : <><FiCheckCircle className="mr-2" /> Apply Now</>}
              </button>
            )}
            {showAppliedMessage && (
              <span className="bg-blue-100 text-blue-800 text-base font-semibold px-5 py-3 rounded-lg shadow-md w-full sm:w-auto text-center">
                You have already applied for this job.
              </span>
            )}
            {showJobPosterMessage && (
              <span className="bg-gray-100 text-gray-700 text-base font-semibold px-5 py-3 rounded-lg shadow-md w-full sm:w-auto text-center">
                (Your Job Post)
              </span>
            )}
            {showAdminOrOtherJobPosterMessage && (
              <span className="bg-gray-100 text-gray-700 text-base font-semibold px-5 py-3 rounded-lg shadow-md w-full sm:w-auto text-center">
                (Admin/Job Poster View)
              </span>
            )}
          </div>
          <div className="mt-8 text-center">
            <Link href="/jobs/find" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors">
              <FiArrowLeft className="mr-2 h-4 w-4" /> Back to Job Search
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
