// src/app/jobs/[id]/applicants/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiUsers, FiBriefcase, FiUser, FiMail, FiFileText, FiArrowLeft, FiXCircle } from 'react-icons/fi';

export default function JobApplicantsPage({ params }: { params: { id: string } }) {
  const { id: jobId } = params;
  const { data: session, status } = useSession();
  const router = useRouter();

  const [applicants, setApplicants] = useState<Array<{
    _id: string;
    name?: string;
    email: string;
    role: string;
    resumeUrl?: string;
  }>>([]);
  
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplicants = useCallback(async () => {
    try {
      if (status === 'unauthenticated' || (session?.user?.status !== 'Approved')) {
        router.push('/login?error=AccessDenied');
        return;
      }

      if (session && !['Job Poster', 'Administrator'].includes(session.user?.role)) {
        setError('Permission denied');
        return;
      }

      setLoading(true);
      
      const jobRes = await fetch(`/api/jobs/${jobId}`);
      if (!jobRes.ok) throw new Error('Failed to fetch job');
      const jobData = await jobRes.json();
      setJobTitle(jobData.jobPost?.title || '');

      const applicantsRes = await fetch(`/api/jobs/${jobId}/applicants`);
      if (!applicantsRes.ok) throw new Error('Failed to fetch applicants');
      const applicantsData = await applicantsRes.json();
      setApplicants(applicantsData.applicants || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [jobId, session, status, router]);

  useEffect(() => {
    if (status !== 'loading') fetchApplicants();
  }, [fetchApplicants, status]);

  if (status === 'loading' || loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p className="font-bold flex items-center gap-2">
            <FiXCircle /> Error
          </p>
          <p>{error}</p>
          <Link href="/" className="text-blue-600 hover:underline mt-2 inline-flex items-center">
            <FiArrowLeft className="mr-1" /> Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Applicants for {jobTitle}</h1>
      
      {applicants.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left">Name</th>
                <th className="text-left">Email</th>
                <th className="text-left">Resume</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map(applicant => (
                <tr key={applicant._id}>
                  <td>{applicant.name || 'N/A'}</td>
                  <td>{applicant.email}</td>
                  <td>
                    {applicant.resumeUrl ? (
                      <a href={applicant.resumeUrl} target="_blank" rel="noopener">
                        View
                      </a>
                    ) : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No applicants found</p>
      )}
    </div>
  );
}