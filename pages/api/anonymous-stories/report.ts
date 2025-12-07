import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { storyId, reason } = req.body;

  if (!storyId) {
    return res.status(400).json({ error: 'Story ID is required' });
  }

  try {
    // First get current reports count
    const { data: currentStory, error: fetchError } = await supabase
      .from('anonymous_stories')
      .select('reports_count')
      .eq('id', storyId)
      .single();

    if (fetchError) {
      console.error('Error fetching current reports:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch story' });
    }

    // Increment reports count
    const { data, error } = await supabase
      .from('anonymous_stories')
      .update({ 
        reports_count: (currentStory?.reports_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId)
      .select('reports_count')
      .single();

    if (error) {
      console.error('Error reporting story:', error);
      return res.status(500).json({ error: 'Failed to report story' });
    }

    // Also add to story_reports table for tracking
    const { error: reportError } = await supabase
      .from('story_reports')
      .upsert({
        story_id: storyId,
        reason: reason || 'Reported by user',
        created_at: new Date().toISOString()
      }, {
        onConflict: 'story_id'
      });

    if (reportError) {
      console.error('Error adding to story_reports:', reportError);
      // Don't fail the request if the secondary insert fails
    }

    return res.status(200).json({ 
      success: true, 
      reports_count: data?.reports_count || 0,
      message: 'Story reported successfully'
    });

  } catch (error) {
    console.error('Error in report API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
