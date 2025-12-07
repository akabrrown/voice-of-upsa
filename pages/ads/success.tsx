import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Button from '../../components/Button';

const AdsSuccessPage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect after 10 seconds
    const timer = setTimeout(() => {
      router.push('/');
    }, 10000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Layout title="Ad Submission Successful - Voice of UPSA" description="Your ad submission has been received successfully">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            {/* Success Message */}
            <h1 className="heading-responsive-2 text-navy dark:text-white mb-4">
              Ad Submission Successful!
            </h1>
            
            <p className="body-responsive-base text-gray-600 dark:text-gray-300 mb-6">
              Thank you for your interest in advertising with Voice of UPSA. 
              Your submission has been received and our team will review it within 24-48 hours.
            </p>

            {/* What to Expect */}
            <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-6 mb-6 text-left">
              <h2 className="heading-responsive-4 text-navy dark:text-white mb-4">
                What happens next?
              </h2>
              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="w-6 h-6 bg-golden text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                    1
                  </span>
                  <div>
                    <h3 className="font-semibold text-navy dark:text-white">Review Process</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Our team will review your submission and contact you if we need any additional information.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="w-6 h-6 bg-golden text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                    2
                  </span>
                  <div>
                    <h3 className="font-semibold text-navy dark:text-white">Approval</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Once approved, we&apos;ll send you payment instructions and finalize the campaign details.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="w-6 h-6 bg-golden text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                    3
                  </span>
                  <div>
                    <h3 className="font-semibold text-navy dark:text-white">Campaign Launch</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Your advertisement will go live on the agreed start date and reach our audience.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
              <h2 className="heading-responsive-4 text-navy dark:text-white mb-3">
                Have Questions?
              </h2>
              <p className="body-responsive-small text-gray-600 dark:text-gray-300 mb-4">
                If you have any questions about your submission or need to make changes, please don&apos;t hesitate to contact us.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:ads@voiceofupsa.com"
                  className="text-golden hover:text-golden-dark font-medium"
                >
                  ads@voiceofupsa.com
                </a>
                <a
                  href="tel:+233501234567"
                  className="text-golden hover:text-golden-dark font-medium"
                >
                  +233 50 123 4567
                </a>
              </div>
            </div>

            {/* Auto-redirect notice */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-6 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                You will be automatically redirected to the homepage in{' '}
                <span className="font-semibold text-golden">10 seconds</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-golden text-white font-semibold rounded-lg hover:bg-golden-dark transition-colors"
              >
                Go to Homepage
              </Button>
              <Button
                onClick={() => router.push('/contact')}
                variant="outline"
                className="px-6 py-3 border border-golden text-golden font-semibold rounded-lg hover:bg-golden hover:text-white transition-colors"
              >
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdsSuccessPage;
