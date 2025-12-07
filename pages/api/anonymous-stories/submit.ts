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
    console.error('[submit] Missing environment variables:', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
    });
    return res.status(500).json({ error: 'Server configuration error: Missing Supabase credentials' });
  }

  if (!supabase) {
    console.error('[submit] Supabase client not initialized');
    return res.status(500).json({ error: 'Server configuration error: Supabase client not initialized' });
  }

  // Handle POST request - submit new story
  if (req.method === 'POST') {
    try {
      const { title, content, category } = req.body;

      // Validate input
      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      if (typeof title !== 'string' || typeof content !== 'string') {
        return res.status(400).json({ error: 'Invalid input types' });
      }

      if (title.trim().length < 5) {
        return res.status(400).json({ error: 'Title must be at least 5 characters' });
      }

      if (content.trim().length < 50) {
        return res.status(400).json({ error: 'Story must be at least 50 characters' });
      }

      if (content.trim().length > 2000) {
        return res.status(400).json({ error: 'Story must be less than 2000 characters' });
      }

      if (title.trim().length > 200) {
        return res.status(400).json({ error: 'Title must be less than 200 characters' });
      }

      // Validate category
      const validCategories = ['general', 'campus-life', 'academics', 'relationships', 'personal-growth', 'struggles', 'achievements'];
      const storyCategory = category || 'general';
      if (!validCategories.includes(storyCategory)) {
        return res.status(400).json({ error: 'Invalid category' });
      }

      // Determine author type based on authentication
      let authorType = 'non_user'; // Default for non-authenticated users
      
      // Check if user is authenticated (this would require auth token in headers)
      const authHeader = req.headers.authorization;
      if (authHeader) {
        try {
          const { data: { user }, error: authError } = await supabase.auth.getUser(
            authHeader.replace('Bearer ', '')
          );
          
          if (!authError && user) {
            authorType = 'user';
          }
        } catch {
          // If auth fails, keep as non_user
          console.log('Auth check failed, treating as non-user');
        }
      }

      // Insert the story
      const { data: story, error: insertError } = await supabase
        .from('anonymous_stories')
        .insert({
          title: title.trim(),
          content: content.trim(),
          category: storyCategory,
          author_type: authorType,
          status: 'pending', // All stories start as pending
        })
        .select()
        .single();

      if (insertError) {
        console.error('Database error inserting story:', insertError);
        
        // Handle specific constraint violations
        if (insertError.code === '23514') {
          return res.status(400).json({ 
            error: 'Invalid story data', 
            details: insertError.message 
          });
        }
        
        throw insertError;
      }

      return res.status(201).json({
        success: true,
        message: 'Story submitted successfully! It will be reviewed by our team.',
        data: story,
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
