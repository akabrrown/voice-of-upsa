import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/Layout';
import AdDetailView from '@/components/AdDetailView';
import { LoadingSpinner } from '@/components/LoadingSkeletons';

interface Advertisement {
  id: string;
  adTitle: string;
  adDescription: string;
  company?: string;
  businessType?: string;
  adType?: string;
  website?: string;
  attachmentUrls?: string[];
  startDate?: string;
  duration?: string;
  targetAudience?: string;
  additionalInfo?: string;
}

const AdDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [ad, setAd] = useState<Advertisement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchAd = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/ads/${id}`);
        const data = await response.json();

        if (response.ok) {
          setAd(data.ad);
        } else {
          setError(data.message || 'Failed to load advertisement');
        }
      } catch (err) {
        console.error('Error fetching ad:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <LoadingSpinner size="large" />
        </div>
      </Layout>
    );
  }

  if (error || !ad) {
    return (
      <Layout title="Advertisement Not Found">
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
          <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-navy dark:text-white mb-4">
            {error || 'Advertisement Not Found'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
            The advertisement you are looking for might have expired, been removed, or the link is incorrect.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 bg-navy text-white rounded-xl hover:bg-navy-light transition-all"
          >
            Back to Homepage
          </button>
        </div>
      </Layout>
    );
  }

  const pageTitle = `${ad.adTitle} - ${ad.company || 'Advertisement'} | Voice of UPSA`;
  const metaDescription = ad.adDescription.substring(0, 160);

  return (
    <Layout title={pageTitle} description={metaDescription}>
      <Head>
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        {ad.attachmentUrls && ad.attachmentUrls.length > 0 && (
          <meta property="og:image" content={ad.attachmentUrls[0]} />
        )}
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      
      <main className="bg-gray-50/50 dark:bg-gray-900/50 min-h-screen">
        <AdDetailView ad={ad} />
      </main>
    </Layout>
  );
};

export default AdDetailPage;
