// src/app/jobs/find/FindJobsClient.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiSearch, FiMapPin, FiBriefcase, FiAward, FiDollarSign, FiClock, FiFilter, FiXCircle, FiGlobe } from 'react-icons/fi';
import { IJobPost } from '@/models/JobPost';
import { ICompany } from '@/models/Company';

interface PopulatedJobPost extends Omit<IJobPost, 'company' | 'postedBy' | 'applicants'> {
  company: ICompany;
  postedBy: { _id: string; name: string; email: string };
  applicants: { _id: string; name: string; email: string }[];
}

// Renamed the function to FindJobsClient
export default function FindJobsClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [jobPosts, setJobPosts] = useState<PopulatedJobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [jobType, setJobType] = useState(searchParams.get('jobType') || '');
  const [experienceLevel, setExperienceLevel] = useState(searchParams.get('experienceLevel') || '');
  const [companyName, setCompanyName] = useState(searchParams.get('companyName') || '');

  const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  };

  const fetchJobs = useCallback(async () => {
    if (status === 'loading') return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (location) params.append('location', location);
    if (jobType) params.append('jobType', jobType);
    if (experienceLevel) params.append('experienceLevel', experienceLevel);
    if (companyName) params.append('companyName', companyName);
    try {
      const response = await fetch(`/api/jobs?${params.toString()}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch jobs');
      }
      const data = await response.json();
      setJobPosts(data.jobPosts);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while fetching jobs.');
      console.error('Fetch Jobs Error:', err);
    } finally {
      setLoading(false);
    }
  }, [status, keyword, location, jobType, experienceLevel, companyName]);

  const debouncedFetchJobs = useCallback(debounce(fetchJobs, 500), [fetchJobs]);

  useEffect(() => {
    if (status === 'authenticated') {
      debouncedFetchJobs();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, debouncedFetchJobs, router]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams();
    if (keyword) newParams.set('keyword', keyword);
    if (location) newParams.set('location', location);
    if (jobType) newParams.set('jobType', jobType);
    if (experienceLevel) newParams.set('experienceLevel', experienceLevel);
    if (companyName) newParams.set('companyName', companyName);
    router.push(`/jobs/find?${newParams.toString()}`);
    fetchJobs();
    setShowMobileFilters(false);
  };

  const handleClearFilters = () => {
    setKeyword('');
    setLocation('');
    setJobType('');
    setExperienceLevel('');
    setCompanyName('');
    router.push('/jobs/find');
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50">
        <div className="inline-block h-12 w-12 border-4 border-[#741ee3] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="lg:hidden mb-6">
          <button
            onClick={() => setShowMobileFilters(true)}
            className="w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-[#741ee3] to-[#9a4dff] hover:from-[#5a16b5] hover:to-[#741ee3] transition-all shadow-lg"
          >
            <FiFilter className="mr-2 h-5 w-5" /> Show Filters
          </button>
        </div>
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          <aside className={`fixed inset-y-0 left-0 transform ${showMobileFilters ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 lg:col-span-1 bg-white p-6 rounded-xl shadow-2xl lg:shadow-xl transition-transform duration-300 ease-in-out z-40 w-80 lg:w-auto overflow-y-auto top-16`}>
            <div className="flex justify-between items-center mb-6 lg:hidden">
              <h2 className="text-2xl font-bold text-gray-800">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiXCircle className="h-7 w-7" />
              </button>
            </div>
            <form onSubmit={handleSearchSubmit} className="space-y-6">
              <div>
                <label htmlFor="keyword" className="block text-sm font-semibold text-gray-700 mb-2">Keyword</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="text" id="keyword" className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-[#741ee3] focus:border-transparent text-base placeholder-gray-400" placeholder="Job title, skills..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                </div>
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="text" id="location" className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-[#741ee3] focus:border-transparent text-base placeholder-gray-400" placeholder="City, State, Remote" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
              </div>
              <div>
                <label htmlFor="jobType" className="block text-sm font-semibold text-gray-700 mb-2">Job Type</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiBriefcase className="h-5 w-5 text-gray-400" />
                  </div>
                  <select id="jobType" className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-[#741ee3] focus:border-transparent text-base appearance-none" value={jobType} onChange={(e) => setJobType(e.target.value)}>
                    <option value="">All Types</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Temporary">Temporary</option>
                    <option value="Internship">Internship</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg></div>
                </div>
              </div>
              <div>
                <label htmlFor="experienceLevel" className="block text-sm font-semibold text-gray-700 mb-2">Experience Level</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiAward className="h-5 w-5 text-gray-400" />
                  </div>
                  <select id="experienceLevel" className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-[#741ee3] focus:border-transparent text-base appearance-none" value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
                    <option value="">All Levels</option>
                    <option value="Entry-level">Entry-level</option>
                    <option value="Mid-level">Mid-level</option>
                    <option value="Senior-level">Senior-level</option>
                    <option value="Director">Director</option>
                    <option value="Executive">Executive</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg></div>
                </div>
              </div>
              <div>
                <label htmlFor="companyName" className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiGlobe className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="text" id="companyName" className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-[#741ee3] focus:border-transparent text-base placeholder-gray-400" placeholder="Specific company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col space-y-3 pt-4">
                <button type="submit" className="w-full bg-gradient-to-r from-[#741ee3] to-[#9a4dff] text-white font-bold py-3 px-4 rounded-lg shadow-md hover:from-[#5a16b5] hover:to-[#741ee3] transition-all focus:outline-none focus:ring-2 focus:ring-[#741ee3] focus:ring-offset-2">Apply Filters</button>
                <button type="button" onClick={handleClearFilters} className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg shadow-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2">Clear Filters</button>
              </div>
            </form>
          </aside>
          {showMobileFilters && (<div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setShowMobileFilters(false)}></div>)}
          <main className="lg:col-span-3">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0"><FiXCircle className="h-6 w-6 text-red-500" /></div>
                  <div className="ml-3"><p className="text-sm font-medium text-red-800">{error}</p></div>
                </div>
              </div>
            )}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#741ee3]"></div>
              </div>
            ) : jobPosts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-xl">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">No jobs found</h3>
                <p className="mt-2 text-gray-600">Try adjusting your search or filter to find what you're looking for.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{jobPosts.length} {jobPosts.length === 1 ? 'Job' : 'Jobs'} Found</h2>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {jobPosts.map((job) => (
                    <div key={(job._id as any).toString()} className="group relative bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-100 w-full">
                      {job.isFeatured && (<div className="absolute top-0 right-0 bg-gradient-to-br from-[#741ee3] to-[#9a4dff] text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10">Featured</div>)}
                      <div className="p-6">
                        <div className="flex items-start mb-4">
                          <div className="flex-shrink-0 h-14 w-14 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-[#741ee3] shadow-md">
                            {job.company?.logoUrl ? (<img src={job.company.logoUrl} alt={job.company.name} className="h-10 w-10 object-contain rounded-full" />) : (<FiBriefcase className="h-7 w-7" />)}
                          </div>
                          <div className="ml-4 flex-1">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#741ee3] transition-colors leading-tight">{job.title}</h3>
                            <p className="text-md text-gray-700 mt-1">{job.company?.name || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center"><FiMapPin className="mr-2 h-4 w-4 text-gray-500 flex-shrink-0" />{job.location}</div>
                          <div className="flex items-center"><FiClock className="mr-2 h-4 w-4 text-gray-500 flex-shrink-0" />{job.jobType}</div>
                          <div className="flex items-center"><FiAward className="mr-2 h-4 w-4 text-gray-500 flex-shrink-0" />{job.experienceLevel}</div>
                          {job.salaryRange && (<div className="flex items-center"><FiDollarSign className="mr-2 h-4 w-4 text-gray-500 flex-shrink-0" />{job.salaryRange}</div>)}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 mb-4">
                          {job.skillsRequired.slice(0, 5).map((skill, index) => (<span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-[#741ee3] shadow-sm">{skill}</span>))}
                          {job.skillsRequired.length > 5 && (<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 shadow-sm">+{job.skillsRequired.length - 5} more</span>)}
                        </div>
                        <p className="mt-4 text-sm text-gray-700 line-clamp-3 mb-6">{job.description}</p>
                        <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                          <span className="text-xs text-gray-500">Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                          <Link href={`/jobs/${(job._id as any).toString()}`} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-[#741ee3] to-[#9a4dff] hover:from-[#5a16b5] hover:to-[#741ee3] transition-all">
                            View Details <svg className="ml-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
