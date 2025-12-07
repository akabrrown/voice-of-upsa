import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import Button from '../../components/Button';

interface AdSubmission {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company?: string;
  business_type: string;
  ad_type: string;
  ad_title: string;
  ad_description: string;
  target_audience: string;
  budget: string;
  duration: string;
  custom_duration?: string;
  start_date: string;
  website?: string;
  additional_info?: string;
  terms_accepted: boolean;
  attachment_urls?: string[];
  status: string;
  payment_status: string;
  payment_reference?: string;
  payment_amount?: number;
  payment_date?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

const MyAds: React.FC = () => {
  const [submissions, setSubmissions] = useState<AdSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);

  useEffect(() => {
    // Try to get email from localStorage (where we might have stored it during submission)
    const storedEmail = localStorage.getItem('user_email');
    if (storedEmail) {
      fetchSubmissions(storedEmail);
    } else {
      setLoading(false);
      setShowEmailInput(true); // Show email input when no email found
    }
  }, []);

  const fetchSubmissions = async (email: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ads/my-submissions?email=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }

      const data = await response.json();
      setSubmissions(data.submissions || []);
      setError('');
      setShowEmailInput(false);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError('Failed to load your ad submissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualEmailSubmit = () => {
    if (manualEmail && manualEmail.includes('@')) {
      localStorage.setItem('user_email', manualEmail);
      fetchSubmissions(manualEmail);
    } else {
      setError('Please enter a valid email address');
    }
  };

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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'under-review':
        return 'Under Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'published':
        return 'Published';
      default:
        return status;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Layout title="My Ad Submissions - Voice of UPSA">
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golden mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading your ad submissions...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>My Ad Submissions - Voice of UPSA</title>
        <meta name="description" content="Track the status of your ad submissions" />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-navy dark:text-white mb-4">
                My Ad Submissions
              </h1>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Track the status of your ad submissions and manage your advertising campaigns.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center mb-8">
              <Link href="/ads">
                <Button className="mr-4">Submit New Ad</Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={() => setShowEmailInput(true)}
                className="mr-4"
              >
                Change Email
              </Button>
              <Link href="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="max-w-4xl mx-auto mb-8">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            )}

            {/* Email Input Section */}
            {showEmailInput && (
              <div className="max-w-4xl mx-auto mb-8">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4">
                    Enter Your Email Address
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300 mb-4">
                    We need your email address to find your ad submissions. This happens when you clear your browser cache or use a different device.
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="email"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="flex-1 px-4 py-2 border border-blue-300 dark:border-blue-700 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    <Button
                      onClick={handleManualEmailSubmit}
                      disabled={!manualEmail || !manualEmail.includes('@')}
                      className="px-6 py-2 bg-golden text-white rounded-lg hover:bg-golden-dark transition-colors disabled:opacity-50"
                    >
                      Find My Ads
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Submissions List */}
            <div className="max-w-4xl mx-auto">
              {submissions.length === 0 && !error ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-navy dark:text-white mb-2">
                    No Ad Submissions Yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    You haven&apos;t submitted any ads yet. Start by submitting your first ad campaign.
                  </p>
                  <Link href="/ads">
                    <Button>Submit Your First Ad</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                      <div className="p-6">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-navy dark:text-white mb-2">
                              {submission.ad_title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                              Submitted on {formatDate(submission.created_at)}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(submission.status)}`}>
                              {getStatusText(submission.status)}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(submission.payment_status)}`}>
                              Payment: {submission.payment_status}
                            </span>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="font-semibold text-navy dark:text-white mb-2">Campaign Details</h4>
                            <div className="space-y-1 text-sm">
                              <p><span className="font-medium">Type:</span> {submission.ad_type}</p>
                              <p><span className="font-medium">Budget:</span> {submission.budget}</p>
                              <p><span className="font-medium">Duration:</span> {submission.duration}
                                {submission.custom_duration && ` (${submission.custom_duration})`}
                              </p>
                              <p><span className="font-medium">Start Date:</span> {submission.start_date}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-navy dark:text-white mb-2">Contact Information</h4>
                            <div className="space-y-1 text-sm">
                              <p><span className="font-medium">Email:</span> {submission.email}</p>
                              <p><span className="font-medium">Phone:</span> {submission.phone}</p>
                              {submission.company && <p><span className="font-medium">Company:</span> {submission.company}</p>}
                            </div>
                          </div>
                        </div>

                        {/* Admin Notes */}
                        {submission.admin_notes && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">Admin Notes</h4>
                            <p className="text-blue-700 dark:text-blue-300 text-sm">{submission.admin_notes}</p>
                          </div>
                        )}

                        {/* Action Buttons based on status */}
                        <div className="flex justify-end space-x-4">
                          {submission.status === 'approved' && submission.payment_status === 'pending' && (
                            <>
                              {submission.id ? (
                                <Link href={`/ads/payment/${submission.id}`}>
                                  <Button size="sm">Complete Payment</Button>
                                </Link>
                              ) : (
                                <Button size="sm" disabled>
                                  Complete Payment (No ID)
                                </Button>
                              )}
                            </>
                          )}
                          {submission.status === 'rejected' && (
                            <Link href="/ads">
                              <Button variant="outline" size="sm">Submit New Ad</Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default MyAds;
