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

  const { storyId, userId, sessionId } = req.body;

  if (!storyId) {
    return res.status(400).json({ error: 'Story ID is required' });
  }

  try {
    // Check if user already liked this story
    let existingLike = null;
    
    if (userId) {
      // Check for authenticated user
      const { data } = await supabase
        .from('story_likes')
        .select('*')
        .eq('story_id', storyId)
        .eq('user_id', userId)
        .single();
      
      existingLike = data;
    } else if (sessionId) {
      // Check for anonymous user by session
      const { data } = await supabase
        .from('story_likes')
        .select('*')
        .eq('story_id', storyId)
        .eq('session_id', sessionId)
        .single();
      
      existingLike = data;
    }

    if (existingLike) {
      // UNLIKE: Remove the like and decrement count
      const { error: unlikeError } = await supabase
        .from('story_likes')
        .delete()
        .eq('story_id', storyId)
        .eq(userId ? 'user_id' : 'session_id', userId || sessionId);

      if (unlikeError) {
        console.error('Error unliking story:', unlikeError);
        return res.status(500).json({ error: 'Failed to unlike story' });
      }

      // Get current likes count
      const { data: currentStory, error: fetchError } = await supabase
        .from('anonymous_stories')
        .select('likes_count')
        .eq('id', storyId)
        .single();

      if (fetchError) {
        console.error('Error fetching current likes:', fetchError);
        return res.status(500).json({ error: 'Failed to fetch story' });
      }

      // Decrement likes count
      const { data, error } = await supabase
        .from('anonymous_stories')
        .update({ 
          likes_count: Math.max(0, (currentStory?.likes_count || 0) - 1),
          updated_at: new Date().toISOString()
        })
        .eq('id', storyId)
        .select('likes_count')
        .single();

      if (error) {
        console.error('Error updating likes count:', error);
        return res.status(500).json({ error: 'Failed to update likes' });
      }

      return res.status(200).json({ 
        success: true, 
        liked: false,
        likes_count: data?.likes_count || 0 
      });

    } else {
      // LIKE: Add the like and increment count
      const { error: likeError } = await supabase
        .from('story_likes')
        .insert({
          story_id: storyId,
          user_id: userId || null,
          session_id: sessionId || null,
        });

      if (likeError) {
        console.error('Error adding like:', likeError);
        return res.status(500).json({ error: 'Failed to like story' });
      }

      // Get current likes count
      const { data: currentStory, error: fetchError } = await supabase
        .from('anonymous_stories')
        .select('likes_count')
        .eq('id', storyId)
        .single();

      if (fetchError) {
        console.error('Error fetching current likes:', fetchError);
        return res.status(500).json({ error: 'Failed to fetch story' });
      }

      // Increment likes count
      const { data, error } = await supabase
        .from('anonymous_stories')
        .update({ 
          likes_count: (currentStory?.likes_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', storyId)
        .select('likes_count')
        .single();

      if (error) {
        console.error('Error liking story:', error);
        return res.status(500).json({ error: 'Failed to like story' });
      }

      return res.status(200).json({ 
        success: true, 
        liked: true,
        likes_count: data?.likes_count || 0 
      });
    }

  } catch (error) {
    console.error('Error in like API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
