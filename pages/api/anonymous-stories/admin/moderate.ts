import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use service role key for admin operations (bypasses RLS)
const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[moderate] API called with method:', req.method);
  
  // Check environment variables
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[moderate] Missing environment variables:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
    });
    return res.status(500).json({ error: 'Server configuration error: Missing Supabase credentials' });
  }

  if (!supabaseAdmin) {
    console.error('[moderate] Supabase admin client not initialized');
    return res.status(500).json({ error: 'Server configuration error: Supabase client not initialized' });
  }

  // Verify admin authorization for all methods
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    console.log('[moderate] No authorization token provided');
    return res.status(401).json({ error: 'Authorization required' });
  }

  try {
    console.log('[moderate] Verifying user token...');
    // Verify user is admin
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.log('[moderate] Auth error:', authError?.message || 'No user found');
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.log('[moderate] User verified:', user.id);

    // Check user role from users table
    console.log('[moderate] Checking user role...');
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('[moderate] User role lookup error:', userError);
      return res.status(403).json({ error: 'Failed to verify user role', details: userError.message });
    }

    if (!userData || (userData.role !== 'admin' && userData.role !== 'editor')) {
      console.log('[moderate] User role insufficient:', userData?.role || 'no role');
      return res.status(403).json({ error: 'Admin access required' });
    }
    console.log('[moderate] User authorized with role:', userData.role);

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        // Get pending stories for review
        try {
          const { data: pendingStories, error: fetchError } = await supabaseAdmin
            .from('anonymous_stories')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

          if (fetchError) {
            console.error('Database error fetching pending stories:', fetchError);
            
            // Check for table doesn't exist error
            if (
                fetchError.code === '42P01' || 
                fetchError.message.includes('does not exist') ||
                fetchError.message.includes('relation')
            ) {
              return res.status(200).json({
                success: true,
                data: [],
                message: 'Anonymous stories table not set up yet.',
              });
            }
            throw fetchError;
          }

          return res.status(200).json({
            success: true,
            data: pendingStories || [],
          });
        } catch (dbError) {
          console.error('Database error:', dbError);
          const errorDetails = dbError instanceof Error ? dbError.message : JSON.stringify(dbError);
          return res.status(500).json({ 
            error: 'Database error', 
            details: errorDetails 
          });
        }

      case 'POST':
        // Moderate a story (approve/decline)
        const { storyId, status, featured } = req.body;

        if (!storyId || !status || !['approved', 'declined'].includes(status)) {
          return res.status(400).json({ error: 'Invalid moderation data' });
        }

        try {
          const updateData: {
            status: string;
            updated_at: string;
            featured?: boolean;
          } = {
            status,
            updated_at: new Date().toISOString(),
          };

          // Add featured flag if approved and featured is true
          if (status === 'approved' && featured) {
            updateData.featured = true;
          }

          const { data: moderatedStory, error: updateError } = await supabaseAdmin
            .from('anonymous_stories')
            .update(updateData)
            .eq('id', storyId)
            .select()
            .single();

          if (updateError) {
            console.error('Database error moderating story:', updateError);
            throw updateError;
          }

          return res.status(200).json({
            success: true,
            message: `Story ${status} successfully`,
            data: moderatedStory,
          });
        } catch (dbError) {
            console.error('Database error:', dbError);
            const errorDetails = dbError instanceof Error ? dbError.message : JSON.stringify(dbError);
            return res.status(500).json({ 
              error: 'Database error', 
              details: errorDetails 
            });
        }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: unknown) {
    console.error('[moderate] Unexpected error in admin moderation API:', error);
    
    // Ensure we capture something meaningful
    const errorDetails = error instanceof Error 
      ? error.message 
      : (typeof error === 'object' ? JSON.stringify(error) : String(error));
      
    res.status(500).json({ 
      error: 'Internal server error', 
      details: errorDetails || 'Unknown error occurred',
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    });
  }
}
