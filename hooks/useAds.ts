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

export const useAds = (adType?: string, locationName?: string): UseAdsResult => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = getSupabaseClient();
        console.log(`Fetching ads for type: ${adType || 'all'}, location: ${locationName || 'all'}`);
        
        let queryBuilder = supabase
          .from('ad_submissions')
          .select(`
            *,
            ad_submission_locations!inner (
              ad_locations!inner (
                name
              )
            )
          `)
          .in('status', ['published', 'approved'])
          .order('created_at', { ascending: false });

        if (locationName && locationName !== 'all') {
          console.log(`Filtering by location_name: ${locationName}`);
          queryBuilder = queryBuilder.eq('ad_submission_locations.ad_locations.name', locationName);
        }

        if (adType && adType !== 'all') {
          console.log(`Filtering by ad_type: ${adType} (or fallback to 'other')`);
          // Include both the specific type and 'other' ads that match the location
          queryBuilder = queryBuilder.or(`ad_type.eq.${adType},ad_type.eq.other`);
        }

        const { data, error: fetchError } = await queryBuilder;
        console.log('Ads query result:', { dataLength: data?.length, fetchError });

        if (fetchError) {
          // Check if table doesn't exist yet
          if (
            fetchError.message.includes('relation') ||
            fetchError.message.includes('does not exist') ||
            (fetchError as { code?: string }).code === '42P01'
          ) {
            console.log('Ad submissions table does not exist yet');
            setAds([]);
            return;
          }
          throw fetchError;
        }

        // Transform from snake_case to camelCase
        const transformedAds = (data || []).map(transformAdRecord);
        console.log('Transformed ads count:', transformedAds.length);
        setAds(transformedAds);
      } catch (err) {
        console.error('Error fetching ads:', err);
        setError('Failed to load ads');
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [adType, locationName]);

  return { ads, loading, error };
};

export const useAdsByType = (type: string) => {
  return useAds(type);
};

export default useAds;

