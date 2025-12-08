import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!supabaseAdmin) {
    console.error('Missing Supabase environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    console.log('Invalid story ID:', id);
    return res.status(400).json({ error: 'Story ID is required' });
  }

  try {
    console.log('Fetching anonymous story:', id);
    const { data: story, error } = await supabaseAdmin
      .from('anonymous_stories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching anonymous story:', error);
      return res.status(500).json({ error: 'Failed to fetch story' });
    }

    if (!story) {
      console.log('Story not found:', id);
      return res.status(404).json({ error: 'Story not found' });
    }

    console.log('Found story:', { id: story.id, views_count: story.views_count });
    res.status(200).json({ 
      success: true, 
      data: story 
    });

  } catch (error) {
    console.error('Error in anonymous story API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
