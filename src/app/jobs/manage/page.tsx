// src/app/jobs/manage/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IJobPost } from '@/models/JobPost';
import { ICompany } from '@/models/Company';
import mongoose from 'mongoose';
import {
  FiBriefcase, FiMapPin, FiClock, FiUsers,
  FiEdit, FiTrash2, FiEye, FiPlus,
  FiArrowLeft, FiXCircle, FiCheckCircle
} from 'react-icons/fi';

interface PopulatedJobPost extends Omit<IJobPost, 'company' | 'postedBy' | 'applicants'> {
  _id: mongoose.Types.ObjectId | string;
  company: ICompany;
  postedBy: { _id: string; name: string; email: string };
  applicants: { _id: string; name: string; email: string }[];
}

export default function ManageJobPostsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [jobPosts, setJobPosts] = useState<PopulatedJobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);

  const fetchMyJobPosts = useCallback(async () => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' || (session && session.user.status !== 'Approved')) {
      router.push('/login?error=AccessDenied');
      return;
    }
    if (session && !['Job Poster', 'Administrator'].includes(session.user.role)) {
      setError('You do not have permission to view this page.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/jobs/posted-by-user');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch your job posts: ${response.status} ${response.statusText}. Details: ${errorText.substring(0, 100)}...`);
      }
      const data = await response.json();
      setJobPosts(data.jobPosts as PopulatedJobPost[]);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while fetching your job posts.');
    } finally {
      setLoading(false);
    }
  }, [session, status, router]);

  useEffect(() => {
    fetchMyJobPosts();
  }, [fetchMyJobPosts]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleDeleteJob = async (jobId: string) => {
    setJobToDelete(jobId);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!jobToDelete) return;

    setDeletingJobId(jobToDelete);
    setError(null);
    setSuccessMessage(null);
    setShowConfirmModal(false);
    try {
      const response = await fetch(`/api/jobs/${jobToDelete}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(data.message || `Failed to delete job post: ${response.status} ${response.statusText}. Details: ${errorText.substring(0, 100)}...`);
      }

      setSuccessMessage('Job post deleted successfully!');
      fetchMyJobPosts();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while deleting job post.');
    } finally {
      setDeletingJobId(null);
      setJobToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setJobToDelete(null);
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
        <div className="bg-purple-50 border border-purple-200 text-purple-700 px-4 py-3 rounded relative max-w-md w-full" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
          <p className="text-sm mt-2">Please try refreshing the page. If you are not a Job Poster or Administrator, you do not have access to this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-8 sm:pt-20 sm:pb-12">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">

        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-[#741ee3] to-[#9a4dff] text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center">
              <FiBriefcase className="h-12 w-12 mr-4 text-white opacity-90" />
              <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">Manage Your Job Posts</h1>
            </div>
            <Link
              href="/jobs/post"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-md text-white bg-[#9a4dff] hover:bg-[#741ee3] transition-all transform hover:scale-105"
            >
              <FiPlus className="mr-2 h-4 w-4" /> Post New Job
            </Link>
          </div>
          <p className="text-sm sm:text-base opacity-90 mt-2">View and manage all the job opportunities you have posted.</p>
        </div>

        <div className="p-6 sm:p-8">
          {successMessage && (
            <div className="bg-purple-50 border border-purple-200 text-purple-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
              <span className="block sm:inline"><FiCheckCircle className="inline mr-2" />{successMessage}</span>
            </div>
          )}

          {jobPosts.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg shadow-inner">
              <FiBriefcase className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg mb-4">You haven't posted any jobs yet.</p>
              <Link
                href="/jobs/post"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-gradient-to-r from-[#741ee3] to-[#9a4dff] hover:from-[#5a16b5] hover:to-[#741ee3] transition-all transform hover:scale-105"
              >
                <FiPlus className="mr-2 h-5 w-5" /> Post Your First Job
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {jobPosts.map((job) => (
                <div key={job._id.toString()} className="bg-white border border-gray-100 rounded-xl p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-start mb-4">
                    <div className="flex-shrink-0 h-14 w-14 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-[#741ee3] shadow-md">
                      {job.company?.logoUrl ? (
                        <img src={job.company.logoUrl} alt={job.company.name} className="h-10 w-10 object-contain rounded-full max-w-full" />
                      ) : (
                        <FiBriefcase className="h-7 w-7" />
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <h2 className="text-xl font-bold text-gray-900 leading-tight break-words">{job.title}</h2>
                      <p className="text-md text-gray-700 mt-1 break-words">{job.company?.name || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <FiMapPin className="mr-2 h-4 w-4 text-gray-500" />
                      {job.location}
                    </div>
                    <div className="flex items-center">
                      <FiClock className="mr-2 h-4 w-4 text-gray-500" />
                      {job.jobType}
                    </div>
                    <div className="flex items-center">
                      <FiUsers className="mr-2 h-4 w-4 text-gray-500" />
                      {job.applicants?.length || 0} Applicants
                    </div>
                    <div className="flex items-center">
                      <FiCheckCircle className="mr-2 h-4 w-4 text-gray-500" />
                      Status: {job.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-6 border-t border-gray-100 pt-5">
                    <Link href={`/jobs/${job._id.toString()}`} className="flex-1 inline-flex items-center justify-center bg-[#741ee3] hover:bg-[#5a16b5] text-white font-bold py-1.5 px-3 rounded-lg text-xs transition duration-200 shadow-md transform hover:scale-105">
                      <FiEye className="mr-1 h-3.5 w-3.5" /> View Details
                    </Link>
                    <Link href={`/jobs/${job._id.toString()}/applicants`} className="flex-1 inline-flex items-center justify-center bg-[#9a4dff] hover:bg-[#741ee3] text-white font-bold py-1.5 px-3 rounded-lg text-xs transition duration-200 shadow-md transform hover:scale-105">
                      <FiUsers className="mr-1 h-3.5 w-3.5" /> Applicants
                    </Link>
                    <button onClick={() => handleDeleteJob(job._id.toString())} className={`flex-1 inline-flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition duration-200 shadow-md transform hover:scale-105 ${deletingJobId === job._id.toString() ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={deletingJobId === job._id.toString()}>
                      {deletingJobId === job._id.toString() ? 'Deleting...' : <><FiTrash2 className="mr-1 h-3.5 w-3.5" /> Delete</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 text-center pb-6 px-4 sm:px-0">
          <Link href="/" className="inline-flex items-center text-[#741ee3] hover:text-[#5a16b5] font-medium transition-colors">
            <FiArrowLeft className="mr-2 h-5 w-5" /> Back to Dashboard
          </Link>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-gray-700 mb-6">Are you sure you want to delete this job post? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button onClick={cancelDelete} className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button onClick={confirmDelete} className="px-5 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
