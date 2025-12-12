import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import Button from '../../components/Button';

const SubmissionSuccess: React.FC = () => {
  return (
    <>
      <Head>
        <title>Ad Submitted Successfully - Voice of UPSA</title>
        <meta name="description" content="Your ad has been submitted successfully and is now under review" />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 text-center">
              {/* Success Icon */}
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* Success Message */}
              <h1 className="text-3xl font-bold text-navy dark:text-white mb-4">
                Ad Submitted Successfully!
              </h1>
              
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Thank you for your interest in advertising with Voice of UPSA. 
                Your ad submission has been received and is now under review by our team.
              </p>

              {/* What Happens Next */}
              <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-6 mb-8 text-left">
                <h2 className="text-xl font-semibold text-navy dark:text-white mb-4">
                  What Happens Next?
                </h2>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm font-semibold">1</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Review Process:</strong> Our team will review your ad submission within 24-48 hours.
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm font-semibold">2</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Approval Notification:</strong> You&apos;ll receive an email with the approval decision.
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm font-semibold">3</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Payment Instructions:</strong> If approved, we&apos;ll send payment instructions with our payment details.
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm font-semibold">4</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Go Live:</strong> Once payment is confirmed, your ad will go live on the platform.
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-navy dark:text-white mb-3">
                  Questions? Contact Us
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Email: <a href="mailto:voice.of.upsa.mail@gmail.com" className="text-golden hover:text-golden-dark">voice.of.upsa.mail@gmail.com</a>
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  Phone: <a href="tel:+233553108760" className="text-golden hover:text-golden-dark">+233 553 108 760</a>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/ads/my-submissions">
                  <Button className="w-full sm:w-auto">
                    View My Submissions
                  </Button>
                </Link>
                <Link href="/ads">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Submit Another Ad
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default SubmissionSuccess;
