// src/app/admin/users/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { IUser } from '@/models/User'; // Import IUser for typing
import Link from 'next/link'; // Import Link for back button
import { FiUsers, FiFilter, FiCheckCircle, FiXCircle, FiClock, FiMail, FiUser, FiArrowLeft } from 'react-icons/fi'; // Import icons

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // State for success messages
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null); // To disable buttons during action
  const [filterStatus, setFilterStatus] = useState<'Pending' | 'Approved' | 'Rejected' | 'All'>('Pending');

  const fetchUsers = useCallback(async () => {
    if (status === 'loading') return;

    if (status === 'unauthenticated' || (session && session.user.role !== 'Administrator')) {
      router.push('/login'); // Redirect if not authenticated or not admin
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'All') {
        params.append('status', filterStatus);
      }

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch users');
      }

      setUsers(data.users);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while fetching users.');
      console.error('Fetch Users Error:', err);
    } finally {
      setLoading(false);
    }
  }, [session, status, router, filterStatus]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Effect to clear success message after a few seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000); // Clear after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleUserAction = async (userId: string, action: 'approve' | 'reject') => {
    setActionLoadingId(userId);
    setError(null);
    setSuccessMessage(null); // Clear previous success messages
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${action} user`);
      }

      setSuccessMessage(`User ${action}d successfully!`);
      fetchUsers(); // Re-fetch list after action
    } catch (err: any) {
      setError(err.message || `An unexpected error occurred while ${action}ing user.`);
      console.error('User Action Error:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="inline-block h-12 w-12 border-4 border-[#741ee3] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (status === 'unauthenticated' || (session && session.user.role !== 'Administrator')) {
    return null; // Redirect handled by useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-8 sm:pt-20 sm:pb-12"> {/* Added pt for navbar clearance */}
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header Section */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-[#741ee3] to-[#9a4dff] text-white">
          <div className="flex items-center">
            <FiUsers className="h-12 w-12 mr-4 text-white opacity-90" />
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">Admin: User Management</h1>
          </div>
          <p className="text-sm sm:text-base opacity-90 mt-2">Oversee and manage user accounts, including approval and rejection.</p>
        </div>

        {/* Content Section */}
        <div className="p-6 sm:p-8">
          {error && (
            <div className="bg-purple-50 border border-purple-200 text-purple-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
              <span className="block sm:inline"><FiXCircle className="inline mr-2" /> {error}</span>
            </div>
          )}
          {successMessage && (
            <div className="bg-purple-50 border border-purple-200 text-purple-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
              <span className="block sm:inline"><FiCheckCircle className="inline mr-2" /> {successMessage}</span>
            </div>
          )}

          {/* Filter by Status */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
            <label htmlFor="statusFilter" className="block text-base font-semibold text-gray-700">Filter by Status:</label>
            <div className="relative flex-1 max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiFilter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="statusFilter"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-[#741ee3] focus:border-transparent text-base appearance-none shadow-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'Pending' | 'Approved' | 'Rejected' | 'All')}
              >
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
              </div>
            </div>
          </div>

          {users.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg shadow-inner">
              <FiUsers className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">No users found with status: <span className="font-semibold text-purple-700">{filterStatus}</span>.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Desired Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Registered On
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={(user._id as any).toString()} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <FiUser className="mr-2 h-4 w-4 text-gray-500" /> {user.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center">
                          <FiMail className="mr-2 h-4 w-4 text-gray-500" /> {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {user.role}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.status === 'Approved' ? 'bg-purple-100 text-purple-800' :
                          user.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : // Keeping yellow for pending as it's a warning state
                          'bg-gray-200 text-gray-800' // Changed rejected to gray
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center">
                          <FiClock className="mr-2 h-4 w-4 text-gray-500" /> {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {user.status === 'Pending' && (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleUserAction((user._id as any).toString(), 'approve')}
                              className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-[#741ee3] hover:bg-[#5a16b5] transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#741ee3] ${actionLoadingId === (user._id as any).toString() ? 'opacity-50 cursor-not-allowed' : ''}`}
                              disabled={actionLoadingId === (user._id as any).toString()}
                            >
                              {actionLoadingId === (user._id as any).toString() ? 'Approving...' : <><FiCheckCircle className="mr-1.5 h-3.5 w-3.5" /> Approve</>}
                            </button>
                            <button
                              onClick={() => handleUserAction((user._id as any).toString(), 'reject')}
                              className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${actionLoadingId === (user._id as any).toString() ? 'opacity-50 cursor-not-allowed' : ''}`}
                              disabled={actionLoadingId === (user._id as any).toString()}
                            >
                              {actionLoadingId === (user._id as any).toString() ? 'Rejecting...' : <><FiXCircle className="mr-1.5 h-3.5 w-3.5" /> Reject</>}
                            </button>
                          </div>
                        )}
                        {(user.status === 'Approved' || user.status === 'Rejected') && (
                          <span className="text-gray-500 px-3 py-1.5 rounded-md bg-gray-100">Actioned</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center pb-6">
          <Link href="/dashboard" className="inline-flex items-center text-[#741ee3] hover:text-[#5a16b5] font-medium transition-colors">
            <FiArrowLeft className="mr-2 h-5 w-5" /> Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
