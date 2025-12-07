import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[get-approved] Missing environment variables:', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
    });
    return res.status(500).json({ error: 'Server configuration error: Missing Supabase credentials' });
  }

  if (!supabase) {
    console.error('[get-approved] Supabase client not initialized');
    return res.status(500).json({ error: 'Server configuration error: Supabase client not initialized' });
  }

  // Handle GET request - fetch approved stories
  if (req.method === 'GET') {
    try {
      const { data: stories, error: fetchError } = await supabase
        .from('anonymous_stories')
        .select('*')
        .eq('status', 'approved')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Database error fetching approved stories:', fetchError);
        
        // Check for table doesn't exist error
        if (
            fetchError.code === '42P01' || 
            fetchError.message.includes('does not exist') ||
            fetchError.message.includes('relation')
        ) {
          return res.status(200).json({
            success: true,
            data: [],
            message: 'Anonymous stories table not set up yet.',
          });
        }
        throw fetchError;
      }

      return res.status(200).json({
        success: true,
        data: stories || [],
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      const errorDetails = dbError instanceof Error ? dbError.message : JSON.stringify(dbError);
      return res.status(500).json({ 
        error: 'Database error', 
        details: errorDetails 
      });
    }
  }

  // Handle other methods
  return res.status(405).json({ error: 'Method not allowed' });
}
