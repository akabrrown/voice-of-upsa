import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabase } from '@/components/SupabaseProvider';
import LayoutSupabase from '@/components/LayoutSupabase';
import toast from 'react-hot-toast';
import { FiMail, FiCheckCircle, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

const AuthCallback: React.FC = () => {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the URL hash which contains the session or error
        const hash = window.location.hash;
        const urlParams = new URLSearchParams(hash.substring(1));
        
        const access_token = urlParams.get('access_token');
        const refresh_token = urlParams.get('refresh_token');
        const error_description = urlParams.get('error_description');

        if (error_description) {
          setError(error_description);
          return;
        }

        if (!access_token) {
          setError('No access token found in the callback URL');
          return;
        }

        // Set the session
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token: refresh_token || '',
        });

        if (sessionError) {
          setError(sessionError.message);
          return;
        }

        // Get the current user to check if email is verified
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?.email_confirmed_at) {
          setSuccess(true);
          toast.success('Email verified successfully!');
          
          // Update the user's email_verified status in the database
          try {
            const response = await fetch('/api/auth/sync-user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: user.id,
                emailVerified: true,
              }),
            });

            if (!response.ok) {
              console.error('Failed to sync email verification status');
            }
          } catch (syncError) {
            console.error('Error syncing email verification:', syncError);
          }
          
          // Redirect to account settings after a short delay
          setTimeout(() => {
            router.push('/account-settings');
          }, 2000);
        } else {
          setError('Email verification failed. Please try again.');
        }

      } catch (err) {
        console.error('Auth callback error:', err);
        setError('An unexpected error occurred during authentication');
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [supabase, router]);

  const handleRetry = () => {
    router.push('/account-settings');
  };

  return (
    <LayoutSupabase>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              {loading ? (
                <FiRefreshCw className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
              ) : success ? (
                <FiCheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : error ? (
                <FiAlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              ) : (
                <FiMail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              {loading ? 'Verifying Email...' : success ? 'Email Verified!' : 'Verification Failed'}
            </h2>
            
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {loading 
                ? 'Please wait while we verify your email address...'
                : success 
                  ? 'Your email has been successfully verified. Redirecting to your account settings...'
                  : error || 'There was a problem verifying your email address.'
              }
            </p>
          </div>

          {!loading && (
            <div className="mt-8 space-y-4">
              {success && (
                <div className="rounded-md bg-green-50 dark:bg-green-900 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FiCheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Email verification completed successfully!
                      </p>
                      <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                        You now have full access to all features.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-md bg-red-50 dark:bg-red-900 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FiAlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        Verification Error
                      </p>
                      <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  {success ? 'Go to Account Settings' : 'Back to Account Settings'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </LayoutSupabase>
  );
};

export default AuthCallback;
