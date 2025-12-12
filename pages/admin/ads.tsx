import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import Button from '../../components/Button';
import { useAuth } from '../../hooks/useAuth';
import { useSupabase } from '../../components/SupabaseProvider';

interface AdSubmission {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  businessType: 'individual' | 'small-business' | 'corporate' | 'non-profit' | 'other';
  adType: 'banner' | 'sidebar' | 'in-article' | 'popup' | 'sponsored-content' | 'other';
  adTitle: string;
  adDescription: string;
  targetAudience: string;
  budget: string;
  duration: '1-week' | '2-weeks' | '1-month' | '3-months' | '6-months' | '1-year' | 'custom';
  startDate: string;
  website?: string;
  additionalInfo?: string;
  termsAccepted: boolean;
  attachmentUrls?: string[];
  status: 'pending' | 'under-review' | 'approved' | 'rejected' | 'published';
  created_at?: string;
  updated_at?: string;
  admin_notes?: string;
}

const AdminAdsPage: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { session, refreshUserRole } = useSupabase();
  const [submissions, setSubmissions] = useState<AdSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<AdSubmission | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user) {
        toast.error('No active session');
        return;
      }
      
      const response = await fetch('/api/admin/ads', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch submissions: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched submissions:', data.data?.ads?.length || 0, 'items');
      console.log('Submissions data:', data.data?.ads);
      setSubmissions(data.data?.ads || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load ad submissions');
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/admin/login');
      return;
    }
    
    if (user.role !== 'admin') {
      console.log('User role is not admin:', user.role, 'refreshing role...');
      refreshUserRole().then(() => {
        // Force a re-render by checking again after refresh
        console.log('Role refreshed, checking again...');
      });
      return;
    }

    fetchSubmissions();
  }, [user, authLoading, refreshUserRole, fetchSubmissions, router]);

  const handleStatusUpdate = async (newStatus: AdSubmission['status']) => {
    if (!selectedSubmission) return;

    try {
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`/api/admin/ads?id=${selectedSubmission.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: adminNotes,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Status update API error:', response.status, errorText);
        throw new Error(`Failed to update status: ${response.status} - ${errorText}`);
      }

      toast.success(`Ad submission ${newStatus} successfully`);
      setShowStatusModal(false);
      setSelectedSubmission(null);
      setAdminNotes('');
      
      fetchSubmissions();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update ad submission');
    }
  };

  const filteredSubmissions = submissions.filter(submission => 
    statusFilter === 'all' || submission.status === statusFilter
  );
  
  console.log('Filter debug:', {
    totalSubmissions: submissions.length,
    statusFilter,
    filteredCount: filteredSubmissions.length,
    submissionsByStatus: submissions.reduce((acc, sub) => {
      acc[sub.status] = (acc[sub.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'under-review':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'published':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading) {
    return (
      <Layout title="Admin - Ad Submissions">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin - Ad Submissions">
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Ad Submissions Management
                </h1>
                <p className="text-gray-600">
                  Review and manage advertisement submissions
                </p>
              </div>
              <Button
                onClick={() => router.push('/admin/ad-locations')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Manage Ad Locations
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <label className="block text-sm font-medium text-gray-700">
                  Filter by Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Submissions</option>
                  <option value="pending">Pending</option>
                  <option value="under-review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={fetchSubmissions}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Refresh'}
                </Button>
              </div>
            </div>
          </div>

          {/* Submissions List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-8">
                <div className="animate-pulse">
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="border-b border-gray-200 pb-4">
                        <div className="flex items-center space-x-4">
                          <div className="h-4 bg-gray-300 rounded w-20"></div>
                          <div className="h-4 bg-gray-300 rounded w-32"></div>
                          <div className="h-4 bg-gray-300 rounded w-24"></div>
                          <div className="h-4 bg-gray-300 rounded w-16"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">
                  {statusFilter === 'all' ? 'No ad submissions found' : `No ${statusFilter} submissions found`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ad Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Budget
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSubmissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(submission.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {submission.firstName} {submission.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{submission.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {submission.adTitle}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {submission.budget}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(submission.status)}`}>
                            {submission.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setAdminNotes(submission.admin_notes || '');
                              setShowStatusModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Update Status
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedSubmission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Update Ad Submission Status
              </h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Submission:</strong> {selectedSubmission.adTitle}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Contact:</strong> {selectedSubmission.firstName} {selectedSubmission.lastName}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Current Status:</strong> {selectedSubmission.status}
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={selectedSubmission.status}
                  onChange={(e) => setSelectedSubmission({...selectedSubmission, status: e.target.value as AdSubmission['status']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="under-review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any notes about this decision..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedSubmission(null);
                    setAdminNotes('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedSubmission.status)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminAdsPage;
