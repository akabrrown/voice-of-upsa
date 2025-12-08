import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!supabaseAdmin) {
    console.error('Missing Supabase environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { storyId, userId, sessionId } = req.body;

  if (!storyId) {
    return res.status(400).json({ error: 'Story ID is required' });
  }

  try {
    // Get IP address for rate limiting
    const ipAddress = (req.headers['x-forwarded-for'] as string) || 
                      (req.connection.remoteAddress as string) || 
                      'unknown';

    // Check if user already liked this story
    let existingLike = null;
    
    if (userId) {
      // Check for authenticated user
      const { data } = await supabaseAdmin
        .from('story_likes')
        .select('*')
        .eq('story_id', storyId)
        .eq('user_id', userId)
        .single();
      
      existingLike = data;
    } else if (sessionId) {
      // Check for anonymous user by session
      const { data } = await supabaseAdmin
        .from('story_likes')
        .select('*')
        .eq('story_id', storyId)
        .eq('session_id', sessionId)
        .single();
      
      existingLike = data;
    } else {
      // Check for anonymous user by IP address
      const { data } = await supabaseAdmin
        .from('story_likes')
        .select('*')
        .eq('story_id', storyId)
        .eq('ip_address', ipAddress)
        .single();
      
      existingLike = data;
    }

    if (existingLike) {
      // UNLIKE: Remove the like and decrement count
      const deleteQuery = supabaseAdmin
        .from('story_likes')
        .delete()
        .eq('story_id', storyId);

      if (userId) {
        deleteQuery.eq('user_id', userId);
      } else if (sessionId) {
        deleteQuery.eq('session_id', sessionId);
      } else {
        deleteQuery.eq('ip_address', ipAddress);
      }

      const { error: unlikeError } = await deleteQuery;

      if (unlikeError) {
        console.error('Error unliking story:', unlikeError);
        return res.status(500).json({ error: 'Failed to unlike story' });
      }

      // Get current likes count
      const { data: currentStory, error: fetchError } = await supabaseAdmin
        .from('anonymous_stories')
        .select('likes_count')
        .eq('id', storyId)
        .single();

      if (fetchError) {
        console.error('Error fetching current likes:', fetchError);
        return res.status(500).json({ error: 'Failed to fetch story' });
      }

      // Decrement likes count
      const { data, error } = await supabaseAdmin
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
      const { error: likeError } = await supabaseAdmin
        .from('story_likes')
        .insert({
          story_id: storyId,
          user_id: userId || null,
          session_id: sessionId || null,
          ip_address: (!userId && !sessionId) ? ipAddress : null
        });

      if (likeError) {
        console.error('Error adding like:', likeError);
        return res.status(500).json({ error: 'Failed to like story' });
      }

      // Get current likes count
      const { data: currentStory, error: fetchError } = await supabaseAdmin
        .from('anonymous_stories')
        .select('likes_count')
        .eq('id', storyId)
        .single();

      if (fetchError) {
        console.error('Error fetching current likes:', fetchError);
        return res.status(500).json({ error: 'Failed to fetch story' });
      }

      // Increment likes count
      const { data, error } = await supabaseAdmin
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
