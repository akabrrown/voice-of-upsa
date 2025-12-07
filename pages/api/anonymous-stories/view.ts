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

  const { storyId, sessionId } = req.body;

  if (!storyId) {
    return res.status(400).json({ error: 'Story ID is required' });
  }

  try {
    // Generate or use provided session ID
    let viewSessionId = sessionId;
    if (!viewSessionId) {
      viewSessionId = 'view_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    // Record the view - skip the story_views table and go directly to update
    console.log('Recording view for story:', storyId);
    
    // Direct update approach - skip the tracking table for now
    const { data: currentStory } = await supabase
      .from('anonymous_stories')
      .select('views_count')
      .eq('id', storyId)
      .single();

    if (currentStory) {
      const { error: updateError } = await supabase
        .from('anonymous_stories')
        .update({ views_count: (currentStory.views_count || 0) + 1 })
        .eq('id', storyId);

      if (updateError) {
        console.error('Error updating view count:', updateError);
        return res.status(500).json({ error: 'Failed to record view' });
      } else {
        console.log('Successfully updated view count to:', (currentStory.views_count || 0) + 1);
      }
    } else {
      return res.status(404).json({ error: 'Story not found' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'View recorded successfully',
      sessionId: viewSessionId
    });

  } catch (error) {
    console.error('View tracking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
