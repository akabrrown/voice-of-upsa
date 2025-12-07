import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../../components/Layout';
import { verifyPayment } from '../../../lib/paystack';
import toast from 'react-hot-toast';
import paymentStyles from '../../../styles/components/Payment.module.css';

const PaymentVerification: React.FC = () => {
  const router = useRouter();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPaymentStatus = async () => {
      const { reference } = router.query;

      if (!reference) {
        setError('No payment reference found');
        setVerifying(false);
        return;
      }

      try {
        const result = await verifyPayment(reference as string);

        if (result.success) {
          setVerified(true);
          toast.success('Payment verified successfully!');
          
          // Redirect to success page after 3 seconds
          setTimeout(() => {
            router.push('/ads/success');
          }, 3000);
        } else {
          setError((result.error as { message?: string })?.message || 'Payment verification failed');
          toast.error('Payment verification failed');
        }
      } catch {
        setError('An error occurred during verification');
        toast.error('Verification error');
      } finally {
        setVerifying(false);
      }
    };

    if (router.isReady) {
      verifyPaymentStatus();
    }
  }, [router.isReady, router.query, router]);

  return (
    <>
      <Head>
        <title>Payment Verification - Voice of UPSA</title>
        <meta name="description" content="Verifying your payment for Voice of UPSA advertisement" />
      </Head>

      <Layout>
        <div className={paymentStyles.paymentVerificationContainer}>
          <div className={`${paymentStyles.paymentVerificationCard} ${paymentStyles.fadeIn}`}>
            {verifying ? (
              <div className="text-center">
                <div className={paymentStyles.paymentLoadingSpinner}></div>
                <h2 className="text-xl font-semibold text-navy mb-2">Verifying Payment</h2>
                <p className="text-gray-600">Please wait while we verify your payment...</p>
              </div>
            ) : verified ? (
              <div className={`text-center ${paymentStyles.slideUp}`}>
                <div className={paymentStyles.paymentSuccessIcon}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-navy mb-2">Payment Successful!</h2>
                <p className="text-gray-600 mb-4">Your payment has been verified successfully.</p>
                <p className="text-sm text-gray-500">Redirecting you to the success page...</p>
              </div>
            ) : (
              <div className={`text-center ${paymentStyles.slideUp}`}>
                <div className={paymentStyles.paymentErrorIcon}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-navy mb-2">Payment Verification Failed</h2>
                <p className="text-gray-600 mb-4">{error || 'We could not verify your payment.'}</p>
                <div className="space-y-2">
                  <button
                    onClick={() => window.location.reload()}
                    className={`w-full ${paymentStyles.paymentButton} bg-golden text-white px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors`}
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => router.push('/ads')}
                    className="w-full bg-gray-200 text-navy px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Back to Ads
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
};

export default PaymentVerification;
