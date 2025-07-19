// src/app/jobs/post/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// Import icons for better visual appeal
import { FiBriefcase, FiFileText, FiMapPin, FiAward, FiDollarSign, FiCalendar, FiPlusCircle, FiX, FiGlobe, FiArrowLeft } from 'react-icons/fi';

export default function PostJobPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [skillsRequired, setSkillsRequired] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState(''); // For adding skills one by one
  const [applicationDeadline, setApplicationDeadline] = useState('');
  const [companyName, setCompanyName] = useState(''); // For adding new company (now the only option)

  const [loading, setLoading] = useState(true); // For initial session load
  const [submitting, setSubmitting] = useState(false); // For form submission
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated' || (session && !['Job Poster', 'Administrator'].includes(session.user.role))) {
      router.push('/login'); // Redirect if not authenticated or unauthorized
      return;
    }
    setLoading(false); // Set loading to false once session is determined
  }, [session, status, router]);

  const handleAddSkill = () => {
    if (skillInput.trim() !== '' && !skillsRequired.includes(skillInput.trim())) {
      setSkillsRequired([...skillsRequired, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkillsRequired(skillsRequired.filter((skill) => skill !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!session || !['Job Poster', 'Administrator'].includes(session.user.role)) {
      setError('You are not authorized to post jobs.');
      setSubmitting(false);
      return;
    }

    // Basic client-side validation
    if (!title || !description || !location || !jobType || !experienceLevel || !companyName) {
      setError('Please fill in all required fields (Title, Description, Location, Job Type, Experience Level, and Company Name).');
      setSubmitting(false);
      return;
    }

    const jobData = {
      title,
      description,
      location,
      jobType,
      experienceLevel,
      salaryRange: salaryRange || undefined,
      skillsRequired,
      applicationDeadline: applicationDeadline || undefined,
      companyName: companyName,
    };

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to post job');
      }

      setSuccess('Job posted successfully!');
      // Optionally clear form or redirect
      setTitle('');
      setDescription('');
      setLocation('');
      setJobType('');
      setExperienceLevel('');
      setSalaryRange('');
      setSkillsRequired([]);
      setSkillInput('');
      setApplicationDeadline('');
      setCompanyName('');

      router.push('/jobs/manage'); // Redirect to manage jobs page after successful post
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while posting job.');
      console.error('Post Job Error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="inline-block h-12 w-12 border-4 border-[#741ee3] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (status === 'unauthenticated' || (session && !['Job Poster', 'Administrator'].includes(session.user.role))) {
    return null; // Redirect handled by useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-8 sm:pt-20 sm:pb-12"> {/* Added pt for navbar clearance */}
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header Section */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-[#741ee3] to-[#9a4dff] text-white">
          <div className="flex items-center">
            <FiBriefcase className="h-12 w-12 mr-4 text-white opacity-90" />
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">Post a New Job</h1>
          </div>
          <p className="text-sm sm:text-base opacity-90 mt-2">Fill out the details below to create a new job posting.</p>
        </div>

        {/* Form Section */}
        <div className="p-6 sm:p-8">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
              <span className="block sm:inline">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">Job Title</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiBriefcase className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="title"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-[#741ee3] focus:border-transparent text-base placeholder-gray-400"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Software Engineer, Marketing Manager"
                  required
                />
              </div>
            </div>

            {/* Job Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">Job Description</label>
              <div className="relative">
                <div className="absolute top-3 left-3 flex items-center pointer-events-none">
                  <FiFileText className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  id="description"
                  rows={6}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-[#741ee3] focus:border-transparent text-base placeholder-gray-400"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a detailed description of the job role, responsibilities, and requirements."
                  required
                ></textarea>
              </div>
            </div>

            {/* Company Name Input */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiGlobe className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="companyName"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-[#741ee3] focus:border-transparent text-base placeholder-gray-400"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., Tech Innovations Inc."
                  required
                />
              </div>
            </div>

            {/* Location & Job Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="location"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-[#741ee3] focus:border-transparent text-base placeholder-gray-400"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Remote, New York, NY"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="jobType" className="block text-sm font-semibold text-gray-700 mb-2">Job Type</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiBriefcase className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="jobType"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-[#741ee3] focus:border-transparent text-base appearance-none"
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    required
                  >
                    <option value="">Select Job Type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Temporary">Temporary</option>
                    <option value="Internship">Internship</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Experience Level & Salary Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="experienceLevel" className="block text-sm font-semibold text-gray-700 mb-2">Experience Level</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiAward className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="experienceLevel"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-[#741ee3] focus:border-transparent text-base appearance-none"
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    required
                  >
                    <option value="">Select Experience Level</option>
                    <option value="Entry-level">Entry-level</option>
                    <option value="Mid-level">Mid-level</option>
                    <option value="Senior-level">Senior-level</option>
                    <option value="Director">Director</option>
                    <option value="Executive">Executive</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="salaryRange" className="block text-sm font-semibold text-gray-700 mb-2">Salary Range (Optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiDollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="salaryRange"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-[#741ee3] focus:border-transparent text-base placeholder-gray-400"
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    placeholder="e.g., $80,000 - $100,000"
                  />
                </div>
              </div>
            </div>

            {/* Skills Required */}
            <div>
              <label htmlFor="skillInput" className="block text-sm font-semibold text-gray-700 mb-2">Skills Required</label>
              <div className="flex mt-1">
                <input
                  type="text"
                  id="skillInput"
                  className="block w-full rounded-l-lg border-gray-300 shadow-sm focus:border-[#741ee3] focus:ring-2 focus:ring-[#741ee3] sm:text-sm p-3 bg-gray-50"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                  placeholder="Type a skill and press Enter or Add"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-r-lg text-white bg-gradient-to-r from-[#741ee3] to-[#9a4dff] hover:from-[#5a16b5] hover:to-[#741ee3] transition-all shadow-md"
                >
                  <FiPlusCircle className="mr-2 h-5 w-5" /> Add
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {skillsRequired.map((skill, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-[#741ee3] shadow-sm">
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-2 -mr-1 h-5 w-5 rounded-full flex items-center justify-center text-[#741ee3] hover:text-red-600 hover:bg-purple-200 focus:outline-none transition-colors"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Application Deadline */}
            <div>
              <label htmlFor="applicationDeadline" className="block text-sm font-semibold text-gray-700 mb-2">Application Deadline (Optional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="applicationDeadline"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-[#741ee3] focus:border-transparent text-base"
                  value={applicationDeadline}
                  onChange={(e) => setApplicationDeadline(e.target.value)}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="inline-flex items-center justify-center py-3 px-8 border border-transparent shadow-lg text-lg font-medium rounded-lg text-white bg-gradient-to-r from-[#741ee3] to-[#9a4dff] hover:from-[#5a16b5] hover:to-[#741ee3] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#741ee3] transform hover:scale-105"
                disabled={submitting}
              >
                {submitting ? 'Posting Job...' : <><FiPlusCircle className="mr-3 h-6 w-6" /> Post Job</>}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <Link href="/jobs/manage" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors">
              <FiArrowLeft className="mr-2 h-5 w-5" /> Back to Manage Jobs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
