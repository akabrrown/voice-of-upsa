import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use service role key for admin operations (bypasses RLS)
const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase admin client not initialized' });
    }

    // Fetch all stories stats
    const { data: allStories, error: allError } = await supabaseAdmin
      .from('anonymous_stories')
      .select('status, likes_count, reports_count');

    if (allError) {
      console.error('Error fetching all stories:', allError);
      return res.status(500).json({ error: 'Failed to fetch stories stats' });
    }

    // Calculate stats
    const totalStories = allStories?.length || 0;
    const approvedStories = allStories?.filter(s => s.status === 'approved').length || 0;
    const pendingStories = allStories?.filter(s => s.status === 'pending').length || 0;
    const reportedStories = allStories?.filter(s => (s.reports_count || 0) > 0).length || 0;
    const totalLikes = allStories?.reduce((sum, s) => sum + (s.likes_count || 0), 0) || 0;
    const totalReports = allStories?.reduce((sum, s) => sum + (s.reports_count || 0), 0) || 0;

    return res.status(200).json({ 
      success: true, 
      data: {
        totalStories,
        approvedStories,
        pendingStories,
        reportedStories,
        totalLikes,
        totalReports
      }
    });

  } catch (error) {
    console.error('Error in stats API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
