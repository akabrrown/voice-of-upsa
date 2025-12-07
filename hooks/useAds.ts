import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Ad {
  id: string;
  adTitle: string;
  adDescription: string;
  adType: string;
  status: string;
  attachmentUrls?: string[];
  website?: string;
  company?: string;
  startDate: string;
  duration: string;
}

interface UseAdsResult {
  ads: Ad[];
  loading: boolean;
  error: string | null;
}

// Transform snake_case database record to camelCase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformAdRecord(record: any): Ad {
  return {
    id: record.id,
    adTitle: record.ad_title,
    adDescription: record.ad_description,
    adType: record.ad_type,
    status: record.status,
    attachmentUrls: record.attachment_urls,
    website: record.website,
    company: record.company,
    startDate: record.start_date,
    duration: record.duration,
  };
}

export const useAds = (adType?: string): UseAdsResult => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('ad_submissions')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (adType && adType !== 'all') {
          query = query.eq('ad_type', adType);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          // Check if table doesn't exist yet
          if (
            fetchError.message.includes('relation') ||
            fetchError.message.includes('does not exist') ||
            (fetchError as { code?: string }).code === '42P01'
          ) {
            // Table doesn't exist yet, return empty array
            setAds([]);
            return;
          }
          throw fetchError;
        }

        // Transform from snake_case to camelCase
        setAds((data || []).map(transformAdRecord));
      } catch (err) {
        console.error('Error fetching ads:', err);
        setError('Failed to load ads');
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [adType]);

  return { ads, loading, error };
};

export const useAdsByType = (type: string) => {
  return useAds(type);
};

export default useAds;

