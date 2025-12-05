import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { SupabaseProvider } from '@/components/SupabaseProvider';
import { NotificationProvider } from '@/components/NotificationProvider';
import { SpeedInsights } from "@vercel/speed-insights/next"
import Head from 'next/head';

function MyApp({ Component, pageProps, router }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <SpeedInsights />
      <SupabaseProvider>
        <NotificationProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
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
          </ThemeProvider>
        </NotificationProvider>
      </SupabaseProvider>
    </>
  );
}

export default MyApp;
