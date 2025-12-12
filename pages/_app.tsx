import '../styles/globals.css';
import '../styles/pages/AdminAdLocations.css';
import type { AppProps } from 'next/app';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { SupabaseProvider } from '@/components/SupabaseProvider';
import { NotificationProvider } from '@/components/NotificationProvider';
import { SpeedInsights } from "@vercel/speed-insights/next"
import Head from 'next/head';
import { useEffect } from 'react';

// Extend Window interface to include CSP nonce
declare global {
  interface Window {
    __CSP_NONCE__?: string;
    __webpack_nonce__?: string;
  }
}

function MyApp({ Component, pageProps, router }: AppProps) {
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
      </Head>
      <SpeedInsights />
      <SupabaseProvider>
        <NotificationProvider>
          <AnimatePresence mode="wait">
            <motion.div
              key={router.route}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Component {...pageProps} />
            </motion.div>
          </AnimatePresence>
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
