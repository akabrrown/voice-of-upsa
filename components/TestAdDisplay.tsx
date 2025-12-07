import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AdRecord {
  id: string;
  ad_title: string;
  ad_description: string;
  ad_type: string;
  status: string;
  company?: string;
  attachment_urls?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface TestAdDisplayProps {
  adType?: string;
  className?: string;
}

const TestAdDisplay: React.FC<TestAdDisplayProps> = ({ adType = "all", className = "" }) => {
  const [ads, setAds] = useState<AdRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        setError(null);

        const query = supabase
          .from('ad_submissions')
          .select('*')
          .order('created_at', { ascending: false });

        console.log(`TestAdDisplay[${adType}]: Starting fetch...`);

        const { data, error: fetchError } = await query;

        console.log(`TestAdDisplay[${adType}] Raw data:`, { data: data?.length, fetchError });

        if (fetchError) {
          throw fetchError;
        }

        setAds(data || []);
      } catch (err) {
        console.error(`TestAdDisplay[${adType}] Error:`, err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [adType]);

  if (loading) {
    return (
      <div className={`border-2 border-blue-500 bg-blue-50 p-4 rounded-lg ${className}`}>
        <p className="text-blue-800">Loading ads...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`border-2 border-red-500 bg-red-50 p-4 rounded-lg ${className}`}>
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  const publishedAds = ads.filter(ad => ad.status === 'published');
  const typeSpecificAds = adType !== "all" ? publishedAds.filter(ad => ad.ad_type === adType) : publishedAds;

  return (
    <div className={`border-2 border-green-500 bg-green-50 p-4 rounded-lg ${className}`}>
      <h3 className="font-bold text-green-800 mb-2">
        Test Ad Display [{adType}]
      </h3>
      
      <div className="text-sm text-green-700 mb-3">
        <p>Total ads: {ads.length}</p>
        <p>Published ads: {publishedAds.length}</p>
        <p>Matching type ({adType}): {typeSpecificAds.length}</p>
      </div>

      {typeSpecificAds.length === 0 ? (
        <div className="bg-yellow-100 border border-yellow-300 rounded p-3">
          <p className="text-yellow-800 text-sm">
            No published ads found for type &quot;{adType}&quot;
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {typeSpecificAds.slice(0, 3).map((ad) => (
            <div key={ad.id} className="bg-white border border-gray-200 rounded p-3">
              <h4 className="font-semibold text-gray-800">{ad.ad_title}</h4>
              <p className="text-sm text-gray-600">{ad.ad_description}</p>
              <p className="text-xs text-gray-500 mt-1">
                Company: {ad.company || 'N/A'} | Type: {ad.ad_type}
              </p>
              {ad.attachment_urls && ad.attachment_urls.length > 0 && (
                <Image 
                  src={ad.attachment_urls[0]} 
                  alt={ad.ad_title}
                  width={300}
                  height={128}
                  className="mt-2 object-cover rounded"
                  unoptimized
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestAdDisplay;
