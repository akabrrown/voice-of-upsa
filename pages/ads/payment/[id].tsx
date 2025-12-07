import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import Button from '../../../components/Button';

interface AdSubmission {
  id: string;
  ad_title: string;
  budget: string;
  status: string;
  payment_status: string;
  payment_amount?: number;
  first_name: string;
  last_name: string;
  email: string;
}

const PaymentPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [submission, setSubmission] = useState<AdSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const fetchSubmission = useCallback(async () => {
    try {
      const response = await fetch(`/api/ads/my-submissions?email=${localStorage.getItem('user_email')}`);
      const data = await response.json();
      
      const foundSubmission = data.submissions.find((sub: AdSubmission) => sub.id === id);
      
      if (foundSubmission) {
        setSubmission(foundSubmission);
      } else {
        setError('Submission not found');
      }
    } catch {
      setError('Failed to load submission details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchSubmission();
    }
  }, [id, fetchSubmission]);

  const initializePayment = async () => {
    if (!submission) return;

    try {
      setProcessing(true);
      
      // Extract amount from budget string (e.g., "GHS 100" -> 100)
      const amountMatch = submission.budget.match(/\d+/);
      const amount = amountMatch ? parseInt(amountMatch[0]) : 100;

      const response = await fetch('/api/ads/payment/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId: submission.id,
          amount: amount,
          email: submission.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to initialize payment');
      }

      // Redirect to Paystack payment page
      window.location.href = data.payment_url;

    } catch (err) {
      console.error('Payment initialization error:', err);
      setError(err instanceof Error ? err.message : 'Payment initialization failed');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Payment - Voice of UPSA">
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golden mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading payment details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !submission) {
    return (
      <Layout title="Payment Error - Voice of UPSA">
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-navy dark:text-white mb-4">Payment Error</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <Link href="/ads/my-submissions">
              <Button>Back to My Submissions</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>Complete Payment - Voice of UPSA</title>
        <meta name="description" content="Complete payment for your approved ad submission" />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-navy dark:text-white mb-4">
                  Complete Payment
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Your ad has been approved! Complete the payment to publish it.
                </p>
              </div>

              {/* Payment Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="p-8">
                  {/* Success Indicator */}
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-green-600 dark:text-green-400 mb-2">
                      Ad Approved!
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      Your ad &quot;{submission.ad_title}&quot; has been approved for publication.
                    </p>
                  </div>

                  {/* Ad Details */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-navy dark:text-white mb-4">Ad Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Ad Title:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{submission.ad_title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Customer:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {submission.first_name} {submission.last_name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Email:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{submission.email}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-300">Amount:</span>
                        <span className="text-2xl font-bold text-golden">{submission.budget}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
                      Payment Information
                    </h3>
                    <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                      <p>• Secure payment powered by Paystack</p>
                      <p>• Multiple payment options available</p>
                      <p>• Instant confirmation after payment</p>
                      <p>• Ad will be published immediately after payment</p>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                      <p className="text-red-700 dark:text-red-300">{error}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-4">
                    <Button
                      onClick={initializePayment}
                      disabled={processing || submission.payment_status === 'paid'}
                      className="w-full py-3 text-lg"
                    >
                      {processing ? 'Processing...' : 'Pay with Paystack'}
                    </Button>

                    <div className="flex gap-4">
                      <Link href="/ads/my-submissions">
                        <Button variant="outline" className="flex-1">
                          Back to Submissions
                        </Button>
                      </Link>
                      <Link href="/">
                        <Button variant="outline" className="flex-1">
                          Home
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support */}
              <div className="text-center mt-8">
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Need help? Contact us at{' '}
                  <a href="mailto:voice.of.upsa.mail@gmail.com" className="text-golden hover:text-golden-dark">
                    voice.of.upsa.mail@gmail.com
                  </a>
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  Call: <a href="tel:+233553108760" className="text-golden hover:text-golden-dark">+233 553 108 760</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default PaymentPage;
