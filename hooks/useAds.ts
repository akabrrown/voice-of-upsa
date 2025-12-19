import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

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

        const supabase = getSupabaseClient();
        console.log(`Fetching ads for type: ${adType || 'all'}`);
        
        let query = supabase
          .from('ad_submissions')
          .select('*')
          .in('status', ['published', 'approved']) // Fetch both published and approved ads
          .order('created_at', { ascending: false });

        if (adType && adType !== 'all') {
          console.log(`Filtering by ad_type: ${adType}`);
          query = query.eq('ad_type', adType);
        }

        const { data, error: fetchError } = await query;

        console.log('Ads query result:', { data, fetchError });

        if (fetchError) {
          // Check if table doesn't exist yet
          if (
            fetchError.message.includes('relation') ||
            fetchError.message.includes('does not exist') ||
            (fetchError as { code?: string }).code === '42P01'
          ) {
            // Table doesn't exist yet, return empty array
            console.log('Ad submissions table does not exist yet');
            setAds([]);
            return;
          }
          throw fetchError;
        }

        // Transform from snake_case to camelCase
        const transformedAds = (data || []).map(transformAdRecord);
        console.log('Transformed ads:', transformedAds);
        
        // If no ads found for specific type, include "other" type ads as fallback
        if (adType && adType !== 'all' && adType !== 'other' && transformedAds.length === 0) {
          console.log(`No ads found for type "${adType}", checking for "other" type ads as fallback`);
          const { data: otherAds, error: otherError } = await supabase
            .from('ad_submissions')
            .select('*')
            .in('status', ['published', 'approved'])
            .eq('ad_type', 'other')
            .order('created_at', { ascending: false });
          
          if (!otherError && otherAds) {
            const otherTransformedAds = otherAds.map(transformAdRecord);
            console.log('Using "other" type ads as fallback:', otherTransformedAds);
            setAds(otherTransformedAds);
            return;
          }
        }
        
        setAds(transformedAds);
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

