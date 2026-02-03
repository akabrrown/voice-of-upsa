import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
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
  businessType: 'individual' | 'small-business' | 'corporate' | 'non-profit' | 'other' | string;
  adType: 'banner' | 'sidebar' | 'in-article' | 'popup' | 'sponsored-content' | 'other' | string;
  adTitle: string;
  adDescription: string;
  targetAudience: string;
  budget: number | string;
  duration: '1-week' | '2-weeks' | '1-month' | '3-months' | '6-months' | '1-year' | 'custom' | string;
  startDate: string;
  website?: string;
  additionalInfo?: string;
  termsAccepted: boolean;
  attachmentUrls?: string[];
  adminNotes?: string;
  customDuration?: string;
  dueDate?: string;
  reminderEnabled?: boolean;
  status: 'pending' | 'under-review' | 'approved' | 'rejected' | 'published' | string;
  created_at?: string;
  updated_at?: string;
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
  const [dueDate, setDueDate] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const statusOptions: { value: AdSubmission['status']; label: string; description: string; badgeClass: string }[] = [
    {
      value: 'pending',
      label: 'Pending',
      description: 'Awaiting review. No action taken yet.',
      badgeClass: 'border-yellow-300 bg-yellow-50 text-yellow-800'
    },
    {
      value: 'under-review',
      label: 'Under Review',
      description: 'Currently being assessed. Await final decision.',
      badgeClass: 'border-blue-300 bg-blue-50 text-blue-800'
    },
    {
      value: 'approved',
      label: 'Approved',
      description: 'Ready to be scheduled or published.',
      badgeClass: 'border-green-300 bg-green-50 text-green-800'
    },
    {
      value: 'rejected',
      label: 'Rejected',
      description: 'Not suitable for publication. Provide rationale.',
      badgeClass: 'border-red-300 bg-red-50 text-red-800'
    },
    {
      value: 'published',
      label: 'Published',
      description: 'Live or scheduled. Monitor performance.',
      badgeClass: 'border-purple-300 bg-purple-50 text-purple-800'
    }
  ];

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
          dueDate: dueDate,
          reminderEnabled: reminderEnabled,
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

  const formatBudget = (value: AdSubmission['budget']) => {
    if (value === null || value === undefined || value === '') return 'N/A';

    if (typeof value === 'number' && !Number.isNaN(value)) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }

    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numeric);
    }

    return value;
  };

  const isImageUrl = (url: string) => {
    if (!url) return false;
    try {
      const cleanedUrl = (url.split('?')[0] ?? '').toLowerCase();
      return /\.(jpg|jpeg|png|gif|webp|bmp|svg|avif)$/i.test(cleanedUrl);
    } catch (error) {
      console.warn('Failed to parse attachment URL', { url, error });
      return false;
    }
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
                onClick={() => {
                  console.log('Manage Ad Locations button clicked');
                  console.log('Current router path:', router.pathname);
                  console.log('Attempting to navigate to /admin/ad-locations');
                  router.push('/admin/ad-locations').then(() => {
                    console.log('Navigation completed');
                  }).catch((error) => {
                    console.error('Navigation error:', error);
                  });
                }}
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
                          {formatBudget(submission.budget)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(submission.status)}`}>
                              {submission.status}
                            </span>
                            {submission.status === 'published' && submission.dueDate && (
                              (() => {
                                const due = new Date(submission.dueDate);
                                const now = new Date();
                                const diff = due.getTime() - now.getTime();
                                const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                if (days <= 7) {
                                  return (
                                    <span className="ml-2 group relative" title={days <= 0 ? "Expired" : `Expires in ${days} days`}>
                                      <svg className={`h-4 w-4 ${days <= 0 ? 'text-red-500' : 'text-yellow-500'} animate-pulse`} fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                  );
                                }
                                return null;
                              })()
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setAdminNotes(submission.adminNotes || '');
                              setDueDate(submission.dueDate || '');
                              setReminderEnabled(submission.reminderEnabled || false);
                              setShowStatusModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Review Submission
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
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 py-10 px-4 sm:px-6">
          <div className="relative mx-auto w-full max-w-5xl">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 py-5 text-white">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Review Submission</p>
                    <h3 className="text-2xl font-semibold mt-2">{selectedSubmission.adTitle}</h3>
                    <p className="text-sm text-blue-100 mt-1">
                      {selectedSubmission.company || 'Independent Advertiser'} • {selectedSubmission.businessType}
                    </p>
                  </div>
                  <div className="flex flex-col items-start md:items-end gap-2">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(selectedSubmission.status)}`}>
                      {statusOptions.find((option) => option.value === selectedSubmission.status)?.label || selectedSubmission.status}
                    </span>
                    <p className="text-xs text-blue-100">
                      Submitted {formatDate(selectedSubmission.created_at)}
                    </p>
                    <button
                      onClick={() => {
                        setShowStatusModal(false);
                        setSelectedSubmission(null);
                        setAdminNotes('');
                        setDueDate('');
                        setReminderEnabled(false);
                      }}
                      className="text-xs font-medium uppercase tracking-wide text-blue-100 hover:text-white transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-6 py-6 space-y-6">
                <section className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
                  <div className="space-y-6">
                    <div className="border border-gray-200 rounded-2xl p-5 bg-gray-50">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">Primary Contact</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {selectedSubmission.firstName} {selectedSubmission.lastName}
                          </p>
                        </div>
                        <div className="flex gap-2 text-sm text-blue-600">
                          <a href={`mailto:${selectedSubmission.email}`} className="hover:underline">
                            {selectedSubmission.email}
                          </a>
                          {selectedSubmission.phone && (
                            <span className="text-gray-400">•</span>
                          )}
                          {selectedSubmission.phone && (
                            <a href={`tel:${selectedSubmission.phone}`} className="hover:underline">
                              {selectedSubmission.phone}
                            </a>
                          )}
                        </div>
                      </div>

                      {(selectedSubmission.company || selectedSubmission.website) && (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {selectedSubmission.company && (
                            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                              <p className="text-xs uppercase tracking-wide text-gray-500">Company</p>
                              <p className="mt-1 text-sm font-medium text-gray-900">{selectedSubmission.company}</p>
                            </div>
                          )}
                          {selectedSubmission.website && (
                            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                              <p className="text-xs uppercase tracking-wide text-gray-500">Website</p>
                              <a
                                href={selectedSubmission.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 inline-flex items-center text-sm font-medium text-blue-600 hover:underline"
                              >
                                {selectedSubmission.website}
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="border border-gray-200 rounded-2xl p-5">
                      <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">Campaign Narrative</p>
                      <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">
                        {selectedSubmission.adDescription}
                      </div>
                    </div>

                    {selectedSubmission.additionalInfo && (
                      <div className="border border-dashed border-gray-300 rounded-2xl p-5 bg-blue-50">
                        <p className="text-xs uppercase tracking-wide text-blue-700 mb-2">Additional Information</p>
                        <p className="text-sm text-blue-900 whitespace-pre-wrap">{selectedSubmission.additionalInfo}</p>
                      </div>
                    )}

                    {selectedSubmission.attachmentUrls && selectedSubmission.attachmentUrls.length > 0 && (
                      <div className="border border-gray-200 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs uppercase tracking-wide text-gray-500">Supporting Assets</p>
                          <span className="text-xs text-gray-400">{selectedSubmission.attachmentUrls.length} file(s)</span>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {selectedSubmission.attachmentUrls.map((url, index) => {
                            const image = isImageUrl(url);
                            return (
                              <a
                                key={url}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group block overflow-hidden rounded-xl border border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 transition"
                              >
                                <div className={`relative w-full ${image ? 'aspect-video bg-gray-200' : 'bg-white'}`}>
                                  {image ? (
                                    <Image
                                      src={url}
                                      alt={`Attachment ${index + 1}`}
                                      fill
                                      unoptimized
                                      sizes="(max-width: 640px) 100vw, 50vw"
                                      className="object-cover transition duration-300 group-hover:scale-[1.02]"
                                    />
                                  ) : (
                                    <div className="flex h-32 w-full items-center justify-center text-sm font-medium text-gray-500">
                                      Preview unavailable
                                    </div>
                                  )}
                                  <span className="absolute left-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-semibold text-blue-600 shadow-sm">
                                    {index + 1}
                                  </span>
                                </div>
                                <div className="px-4 py-3">
                                  <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700">Attachment {index + 1}</p>
                                  <p className="mt-1 text-xs text-gray-500 truncate">{url}</p>
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <aside className="space-y-6">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                      <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">Campaign Specs</p>
                      <dl className="space-y-4 text-sm text-gray-700">
                        <div className="flex items-center justify-between">
                          <dt className="text-gray-500">Ad Type</dt>
                          <dd className="font-medium text-gray-900">{selectedSubmission.adType}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt className="text-gray-500">Target Audience</dt>
                          <dd className="font-medium text-gray-900 text-right ml-4">
                            {selectedSubmission.targetAudience || '—'}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt className="text-gray-500">Budget</dt>
                          <dd className="font-medium text-gray-900">{formatBudget(selectedSubmission.budget)}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt className="text-gray-500">Duration</dt>
                          <dd className="font-medium text-gray-900">
                            {selectedSubmission.duration === 'custom' 
                              ? `Custom (${selectedSubmission.customDuration || 'Not specified'})` 
                              : selectedSubmission.duration}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt className="text-gray-500">Preferred Start</dt>
                          <dd className="font-medium text-gray-900">{formatDate(selectedSubmission.startDate)}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt className="text-gray-500">Reminders</dt>
                          <dd>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${selectedSubmission.reminderEnabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                              {selectedSubmission.reminderEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt className="text-gray-500">Terms Accepted</dt>
                          <dd>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${selectedSubmission.termsAccepted ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {selectedSubmission.termsAccepted ? 'Accepted' : 'Not Accepted'}
                            </span>
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                      <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">Decision</p>
                      <div className="space-y-3">
                        {statusOptions.map((option) => {
                          const isActive = selectedSubmission.status === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setSelectedSubmission((prev) => (prev ? { ...prev, status: option.value } : prev));
                              }}
                              className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                                isActive
                                  ? `border-blue-500 bg-blue-50 text-blue-800 shadow-sm`
                                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                              }`}
                            >
                              <span className="flex items-start justify-between gap-3">
                                <span>
                                  <span className="block text-sm font-semibold">
                                    {option.label}
                                  </span>
                                  <span className={`mt-1 block text-xs ${isActive ? 'text-blue-700' : 'text-gray-500'}`}>
                                    {option.description}
                                  </span>
                                </span>
                                {isActive && (
                                  <span className="inline-flex h-2.5 w-2.5 flex-none rounded-full bg-blue-500" aria-hidden="true"></span>
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                      <label className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
                        Admin Notes
                      </label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={5}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                        placeholder="Add context for the advertiser or internal team..."
                      />
                      <p className="mt-2 text-xs text-gray-400">
                        These notes will be stored with the submission for future reference.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
                            Set Due Date (Resubscription)
                          </label>
                          <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="adminReminderEnabled"
                            checked={reminderEnabled}
                            onChange={(e) => setReminderEnabled(e.target.checked)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="adminReminderEnabled" className="text-sm text-gray-700">
                            Enable Resubscription Reminders
                          </label>
                        </div>
                      </div>
                    </div>
                  </aside>
                </section>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 pt-4 mt-4">
                  <button
                    onClick={() => {
                      setShowStatusModal(false);
                      setSelectedSubmission(null);
                      setAdminNotes('');
                      setDueDate('');
                      setReminderEnabled(false);
                    }}
                    className="inline-flex items-center justify-center rounded-xl border border-transparent px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                  >
                    Cancel Review
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedSubmission.status)}
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                  >
                    Save Decision
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminAdsPage;
