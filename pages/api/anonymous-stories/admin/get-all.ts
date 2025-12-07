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

    // Fetch all stories with reports, ordered by creation date
    const { data, error } = await supabaseAdmin
      .from('anonymous_stories')
      .select(`
        *,
        story_reports (
          reason,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all stories:', error);
      return res.status(500).json({ error: 'Failed to fetch all stories' });
    }

    return res.status(200).json({ 
      success: true, 
      data: data || [] 
    });

  } catch (error) {
    console.error('Error in get all stories API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
