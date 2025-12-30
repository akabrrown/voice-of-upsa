import '../styles/globals.css';
import '../styles/pages/AdminAdLocations.css';
import type { AppProps } from 'next/app';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { SupabaseProvider } from '@/components/SupabaseProvider';
import { NotificationProvider } from '@/components/NotificationProvider';
import { SpeedInsights } from "@vercel/speed-insights/next"
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

// Extend Window interface to include CSP nonce
// Force rebuild to clear stale artifacts - 2025-12-30
declare global {
  interface Window {
    __CSP_NONCE__?: string;
    __webpack_nonce__?: string;
  }
}

const RouteProgressBar = () => {
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const handleStart = () => setIsAnimating(true);
    const handleStop = () => setIsAnimating(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleStop);
    router.events.on('routeChangeError', handleStop);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleStop);
      router.events.off('routeChangeError', handleStop);
    };
  }, [router]);

  return (
    <AnimatePresence>
      {isAnimating && (
        <motion.div
          key="progress-bar"
          initial={{ width: "0%", opacity: 1 }}
          animate={{ width: "70%" }} // Go to 70% and wait
          exit={{ width: "100%", opacity: 0 }}
          transition={{ 
            width: { duration: 10, ease: "easeOut" },
            opacity: { duration: 0.3 }
          }}
          className="fixed top-0 left-0 h-1 bg-golden z-[9999] shadow-[0_0_10px_rgba(255,215,0,0.5)]"
        />
      )}
    </AnimatePresence>
  );
};

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Ensure styled-components can access the nonce
    if (typeof window !== 'undefined' && window.__CSP_NONCE__) {
      window.__webpack_nonce__ = window.__CSP_NONCE__;
      
      // Force styled-components to recognize the nonce
      const styleElements = document.querySelectorAll('style[data-styled]');
      styleElements.forEach((style) => {
        if (style.getAttribute('nonce') !== window.__CSP_NONCE__) {
          style.setAttribute('nonce', window.__CSP_NONCE__!);
        }
      });
    }
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Standard Meta Tags */}
        {pageProps?.fetchError && (
          <meta name="ssr-fetch-error" content={JSON.stringify(pageProps.fetchError)} />
        )}
        {pageProps?.ssrError && (
          <meta name="ssr-error" content={typeof pageProps.ssrError === 'string' ? pageProps.ssrError : JSON.stringify(pageProps.ssrError)} />
        )}
        {pageProps?.initialArticle && (
          <meta name="ssr-article-slug" content={pageProps.initialArticle.slug} />
        )}
      </Head>
      <SpeedInsights />
      <SupabaseProvider>
        <NotificationProvider>
          <RouteProgressBar />
          <Component {...pageProps} />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#001F3F',
                color: '#FFFFFF',
              },
              success: {
                style: {
                  background: '#FFD700',
                  color: '#001F3F',
                },
              },
              error: {
                style: {
                  background: '#DC2626',
                  color: '#FFFFFF',
                },
              },
            }}
          />
        </NotificationProvider>
      </SupabaseProvider>
    </>
  );
}

export default MyApp;
