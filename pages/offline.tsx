import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Offline() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Automatically redirect to home when back online
      setTimeout(() => {
        router.push('/');
      }, 1500);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Check initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router]);

  return (
    <>
      <Head>
        <title>Offline - Voice of UPSA</title>
        <meta name="description" content="You are currently offline" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-[#001F3F] to-[#003366] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
            {/* Icon */}
            <div className="mb-6">
              <svg
                className="w-24 h-24 mx-auto text-[#FFD700]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                />
              </svg>
            </div>

            {/* Status Message */}
            {isOnline ? (
              <div className="space-y-4">
                <h1 className="text-3xl font-bold text-[#FFD700]">
                  Back Online!
                </h1>
                <p className="text-white/90">
                  Redirecting you to the homepage...
                </p>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD700]"></div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h1 className="text-3xl font-bold text-white">
                  You&apos;re Offline
                </h1>
                <p className="text-white/80 text-lg">
                  It looks like you&apos;ve lost your internet connection.
                </p>
                <p className="text-white/60">
                  Don&apos;t worry! We&apos;ll automatically reconnect you when you&apos;re back online.
                </p>

                {/* Action Button */}
                <div className="pt-6">
                  <Link
                    href="/"
                    className="inline-block bg-[#FFD700] text-[#001F3F] font-semibold px-8 py-3 rounded-lg hover:bg-[#FFC700] transition-colors duration-200 shadow-lg"
                  >
                    Try Again
                  </Link>
                </div>
              </div>
            )}

            {/* Connection Status Indicator */}
            <div className="mt-8 pt-6 border-t border-white/20">
              <div className="flex items-center justify-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isOnline ? 'bg-green-400' : 'bg-red-400'
                  } animate-pulse`}
                ></div>
                <span className="text-white/60 text-sm">
                  {isOnline ? 'Connected' : 'No Connection'}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <p className="mt-6 text-white/50 text-sm">
            Voice of UPSA - Your campus news source
          </p>
        </div>
      </div>
    </>
  );
}
