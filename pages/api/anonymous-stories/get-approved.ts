import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check environment variables
  if (!supabaseAdmin) {
    console.error('Missing Supabase environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Handle GET request - fetch approved stories
  if (req.method === 'GET') {
    try {
      const { data: stories, error: fetchError } = await supabaseAdmin
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
