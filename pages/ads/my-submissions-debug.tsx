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

interface DebugInfo {
  storedEmail?: string | null;
  allKeys?: string[];
  localStorageContent?: Record<string, string>;
  apiResponse?: {
    message: string;
    submissions: AdSubmission[];
  };
  fetchError?: unknown;
}

const MyAdsDebug: React.FC = () => {
  const [submissions, setSubmissions] = useState<AdSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});
  const [manualEmail, setManualEmail] = useState('');

  useEffect(() => {
    // Debug localStorage
    const storedEmail = localStorage.getItem('user_email');
    console.log('Debug - Stored email:', storedEmail);
    console.log('Debug - All localStorage keys:', Object.keys(localStorage));
    
    setDebugInfo({
      storedEmail,
      allKeys: Object.keys(localStorage),
      localStorageContent: { ...localStorage }
    });

    if (storedEmail) {
      fetchSubmissions(storedEmail);
    } else {
      setLoading(false);
      setError('No email found in localStorage. Please submit an ad first.');
    }
  }, []);

  const fetchSubmissions = async (email: string) => {
    try {
      setLoading(true);
      console.log('Debug - Fetching submissions for:', email);
      
      const response = await fetch(`/api/ads/my-submissions?email=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }

      const data = await response.json();
      console.log('Debug - API response:', data);
      
      setSubmissions(data.submissions || []);
      setDebugInfo(prev => ({ ...prev, apiResponse: data }));
    } catch (err) {
      console.error('Debug - Error fetching submissions:', err);
      setError('Failed to load your ad submissions. Please try again.');
      setDebugInfo(prev => ({ ...prev, fetchError: err }));
    } finally {
      setLoading(false);
    }
  };

  const handleManualFetch = () => {
    if (manualEmail) {
      localStorage.setItem('user_email', manualEmail);
      fetchSubmissions(manualEmail);
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
      <Layout title="Debug My Ad Submissions - Voice of UPSA">
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
        <title>Debug My Ad Submissions - Voice of UPSA</title>
        <meta name="description" content="Debug version of ad submissions tracking" />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-navy dark:text-white mb-4">
                Debug My Ad Submissions
              </h1>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Debug version to troubleshoot ad submission display issues.
              </p>
            </div>

            {/* Debug Information */}
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-4">Debug Information</h3>
                <pre className="text-xs text-red-700 dark:text-red-300 whitespace-pre-wrap mb-4">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
                
                {/* Manual Email Input */}
                <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
                  <h4 className="text-md font-semibold text-red-800 dark:text-red-200 mb-2">Manual Email Test</h4>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      placeholder="Enter email to test"
                      className="flex-1 px-3 py-2 border border-red-300 dark:border-red-700 rounded-md bg-white dark:bg-gray-800 text-red-900 dark:text-red-100"
                    />
                    <Button
                      onClick={handleManualFetch}
                      disabled={!manualEmail}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      Test Email
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center mb-8">
              <Link href="/ads">
                <Button className="mr-4">Submit New Ad</Button>
              </Link>
              <Link href="/ads/my-submissions">
                <Button variant="outline">Go to Normal Page</Button>
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

            {/* Submissions List */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
                <h3 className="text-xl font-semibold text-navy dark:text-white mb-4">
                  Found {submissions.length} Submissions
                </h3>
                
                {submissions.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-300">No submissions found.</p>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <div key={submission.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-navy dark:text-white">
                              {submission.ad_title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {submission.email} - {formatDate(submission.created_at)}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(submission.status)}`}>
                            {getStatusText(submission.status)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          <p>Budget: {submission.budget} | Status: {submission.status} | Payment: {submission.payment_status}</p>
                          {submission.admin_notes && <p>Admin Notes: {submission.admin_notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default MyAdsDebug;
