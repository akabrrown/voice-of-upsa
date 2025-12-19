import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Define interfaces for better type safety
interface AdRecord {
  id: string;
  ad_title: string;
  ad_description: string;
  ad_type: string;
  status: string;
  attachment_urls?: string[];
  website?: string;
  company?: string;
  start_date: string;
  duration: string;
  created_at: string;
  updated_at: string;
}

interface AdsByTypeResult {
  data: AdRecord[];
  error: unknown;
}

interface DebugResponse {
  count: number;
  error: unknown;
  ads: AdRecord[];
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get all ads regardless of status
    const { data: allAds, error: allError } = await supabase
      .from('ad_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    // Get published/approved ads
    const { data: publishedAds, error: publishedError } = await supabase
      .from('ad_submissions')
      .select('*')
      .in('status', ['published', 'approved'])
      .order('created_at', { ascending: false });

    // Get ads by type
    const adTypes = ['banner', 'sidebar', 'in-article', 'popup', 'sponsored-content'];
    const adsByType: Record<string, AdsByTypeResult> = {};
    
    for (const type of adTypes) {
      const { data: typeAds, error: typeError } = await supabase
        .from('ad_submissions')
        .select('*')
        .eq('ad_type', type)
        .in('status', ['published', 'approved'])
        .order('created_at', { ascending: false });
      
      adsByType[type] = { data: typeAds as AdRecord[] || [], error: typeError };
    }

    res.status(200).json({
      allAds: {
        data: allAds,
        error: allError,
        count: allAds?.length || 0
      },
      publishedAds: {
        data: publishedAds,
        error: publishedError,
        count: publishedAds?.length || 0
      },
      adsByType: Object.keys(adsByType).reduce((acc: Record<string, DebugResponse>, type: string) => {
        const typeData = adsByType[type];
        if (typeData) {
          acc[type] = {
            count: typeData.data?.length || 0,
            error: typeData.error,
            ads: typeData.data?.slice(0, 2) // Show first 2 ads of each type
          };
        }
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Debug ads error:', error);
    res.status(500).json({ error: 'Internal server error', details: error });
  }
}
