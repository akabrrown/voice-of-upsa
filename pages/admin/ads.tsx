import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import Button from '../../components/Button';
import { useAuth } from '../../hooks/useAuth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  const [submissions, setSubmissions] = useState<AdSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<AdSubmission | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/admin/ads', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }

      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load ad submissions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/admin/login');
      return;
    }

    if (user && user.role === 'admin') {
      fetchSubmissions();
    }
  }, [user, authLoading, router, fetchSubmissions]);

  const handleStatusUpdate = async (newStatus: AdSubmission['status']) => {
    if (!selectedSubmission) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
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
        throw new Error('Failed to update status');
      }

      toast.success(`Ad submission ${newStatus} successfully`);
      setShowStatusModal(false);
      setSelectedSubmission(null);
      setAdminNotes('');
      
      // Refresh submissions
      fetchSubmissions();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update ad submission');
    }
  };

  const filteredSubmissions = submissions.filter(submission => 
    statusFilter === 'all' || submission.status === statusFilter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'under-review':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'published':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
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

  if (authLoading || loading) {
    return (
      <Layout title="Admin - Ad Submissions">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golden mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin - Ad Submissions">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="heading-responsive-1 text-navy dark:text-white mb-2">
              Ad Submissions Management
            </h1>
            <p className="body-responsive-base text-gray-600 dark:text-gray-300">
              Review and manage advertisement submissions
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Filter by Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                  className="px-4 py-2 bg-golden text-white rounded-lg hover:bg-golden-dark transition-colors"
                >
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Submissions List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            {filteredSubmissions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  {statusFilter === 'all' ? 'No ad submissions found' : `No ${statusFilter} submissions found`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Ad Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Budget
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredSubmissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(submission.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {submission.firstName} {submission.lastName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {submission.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <span className="capitalize">{submission.adType.replace('-', ' ')}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {submission.budget}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                            <span className="capitalize">{submission.status.replace('-', ' ')}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setShowStatusModal(true);
                            }}
                            className="text-golden hover:text-golden-dark mr-3"
                          >
                            Review
                          </Button>
                          <Button
                            onClick={() => window.open(`mailto:${submission.email}`, '_blank')}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                          >
                            Email
                          </Button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="heading-responsive-3 text-navy dark:text-white mb-4">
                Review Ad Submission
              </h2>
              
              {/* Submission Details */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Name:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedSubmission.firstName} {selectedSubmission.lastName}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Email:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedSubmission.email}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Phone:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedSubmission.phone}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Company:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedSubmission.company || 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Ad Title:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedSubmission.adTitle}</p>
                </div>
                
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Ad Description:</span>
                  <p className="text-gray-700 dark:text-gray-300">{selectedSubmission.adDescription}</p>
                </div>
                
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Target Audience:</span>
                  <p className="text-gray-700 dark:text-gray-300">{selectedSubmission.targetAudience}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Budget:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedSubmission.budget}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Duration:</span>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">
                      {selectedSubmission.duration.replace('-', ' ')}
                    </p>
                  </div>
                </div>
                
                {selectedSubmission.website && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Website:</span>
                    <a 
                      href={selectedSubmission.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-golden hover:underline block"
                    >
                      {selectedSubmission.website}
                    </a>
                  </div>
                )}
                
                {selectedSubmission.additionalInfo && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Additional Info:</span>
                    <p className="text-gray-700 dark:text-gray-300">{selectedSubmission.additionalInfo}</p>
                  </div>
                )}
                
                {selectedSubmission.attachmentUrls && selectedSubmission.attachmentUrls.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Attachments:</span>
                    <div className="space-y-2 mt-1">
                      {selectedSubmission.attachmentUrls.map((url, index) => (
                        <a 
                          key={index}
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-golden hover:underline block"
                        >
                          View Attachment {index + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Admin Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Add notes about this submission..."
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => handleStatusUpdate('approved')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Approve
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('rejected')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reject
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('under-review')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Under Review
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('published')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Publish
                </Button>
                <Button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedSubmission(null);
                    setAdminNotes('');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminAdsPage;
