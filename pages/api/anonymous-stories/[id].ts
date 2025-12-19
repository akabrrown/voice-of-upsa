import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { Database } from '@/lib/database-types';
import type { PostgrestError } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    const supabaseAdmin = await getSupabaseAdmin();
    
    if (!supabaseAdmin) {
      console.error('Failed to initialize Supabase admin client');
      return res.status(500).json({ error: 'Internal server error' });
    }

    const { data: story, error } = await supabaseAdmin
      .from('anonymous_stories')
      .select('*')
      .eq('id', id)
      .single() as { data: Database['public']['Tables']['anonymous_stories']['Row'] | null; error: PostgrestError | null };

    if (error) {
      console.error('Error fetching anonymous story:', error);
      return res.status(500).json({ error: 'Failed to fetch story' });
    }

    if (!story) {
      console.log('Story not found:', id);
      return res.status(404).json({ error: 'Story not found' });
    }

    // Security check: Only allow viewing approved stories, unless admin
    if (story.status !== 'approved') {
      let authorized = false;
      
      // Check for auth header to see if it's an admin/editor
      const authHeader = req.headers.authorization;
      if (authHeader) {
        try {
          const { data: { user } } = await supabaseAdmin.auth.getUser(
            authHeader.replace('Bearer ', '')
          );
          
          if (user) {
             const { data: userData } = await supabaseAdmin
              .from('users')
              .select('role')
              .eq('id', user.id)
              .single() as { data: { role: 'user' | 'admin' | 'editor' } | null; error: PostgrestError | null };
              
              if (userData && (userData.role === 'admin' || userData.role === 'editor')) {
                authorized = true;
              }
          }
        } catch (authError) {
          console.error('Auth check failed:', authError);
        }
      }

      if (!authorized) {
        console.log('Unauthorized access attempt to pending story:', id);
        // Return 404 to avoid leaking existence of pending stories
        return res.status(404).json({ error: 'Story not found' });
      }
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
