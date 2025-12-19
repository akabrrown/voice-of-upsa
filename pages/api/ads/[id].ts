import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Missing or invalid ad ID' });
  }

  try {
    const supabase = createClient({ req, res });

    const { data: ad, error } = await supabase
      .from('ad_submissions')
      .select('*')
      .eq('id', id)
      .in('status', ['published', 'approved'])
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'Advertisement not found' });
      }
      throw error;
    }

    return res.status(200).json({ ad });
  } catch (error: unknown) {
    console.error('Error fetching ad detail:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ message: errorMessage });
  }
}
