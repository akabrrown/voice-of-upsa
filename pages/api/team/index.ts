import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database-types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Database error fetching team members:', error);
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: data
    });
  } catch (error: unknown) {
    console.error('API Error in /api/team:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch team members',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}
