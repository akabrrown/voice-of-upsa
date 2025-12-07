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

  const { userId, sessionId } = req.body;

  try {
    let likedStories = [];

    if (userId) {
      // Get liked stories for authenticated user
      const { data, error } = await supabase
        .from('story_likes')
        .select('story_id')
        .eq('user_id', userId);
      
      if (!error && data) {
        likedStories = data.map(like => like.story_id);
      }
    } else if (sessionId) {
      // Get liked stories for anonymous user by session
      const { data, error } = await supabase
        .from('story_likes')
        .select('story_id')
        .eq('session_id', sessionId);
      
      if (!error && data) {
        likedStories = data.map(like => like.story_id);
      }
    }

    return res.status(200).json({ 
      likedStories 
    });

  } catch (error) {
    console.error('Error fetching user likes:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
