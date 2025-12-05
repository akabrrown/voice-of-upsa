import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/database-server';
import { Database } from '@/lib/database-types';

type User = Database['public']['Tables']['users']['Row'];
type Article = Database['public']['Tables']['articles']['Row'];
type Comment = Database['public']['Tables']['comments']['Row'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Extract and validate token
    const token = req.headers.authorization?.split(' ')[1] || '';
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    const userId = user.id;

    // Fetch all user data
    const [profile, articles, comments] = await Promise.all([
      // User profile
      (supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()) as unknown as Promise<{ data: User | null; error: unknown }>,
      
      // User's articles
      (supabaseAdmin
        .from('articles')
        .select('*')
        .eq('author_id', userId)
        .order('created_at', { ascending: false })) as unknown as Promise<{ data: Article[] | null; error: unknown }>,
      
      // User's comments
      (supabaseAdmin
        .from('comments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })) as unknown as Promise<{ data: Comment[] | null; error: unknown }>
    ]);

    // Compile user data
    const userData = {
      export_date: new Date().toISOString(),
      user: {
        id: profile.data?.id,
        email: profile.data?.email,
        name: profile.data?.name,
        role: profile.data?.role,
        bio: profile.data?.bio,
        avatar_url: profile.data?.avatar_url,
        status: profile.data?.status,
        created_at: profile.data?.created_at,
        updated_at: profile.data?.updated_at,
        last_sign_in: profile.data?.last_sign_in
      },
      articles: articles.data || [],
      comments: comments.data || []
    };

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-data-${new Date().toISOString().split('T')[0]}.json"`);

    return res.status(200).json(userData);

  } catch (error) {
    console.error('Error exporting user data:', error);
    return res.status(500).json({ error: 'Failed to export data' });
  }
}

