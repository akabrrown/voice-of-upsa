import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';

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

    // Get IP address for rate limiting
    const ipAddress = (req.headers['x-forwarded-for'] as string) || 
                      (req.connection.remoteAddress as string) || 
                      'unknown';

    const supabaseAdmin = await getSupabaseAdmin();

    // Try to record the view in story_views table
    // We strive for uniqueness:
    // 1. By Session ID (for same browser)
    // 2. By IP Address (for different browsers/incognito on same device)
    
    // Note: The database has unique indexes on (story_id, user_id), (story_id, session_id) AND (story_id, ip_address)
    // Inserting this will fail if ANY of these constraints are violated, which is exactly what we want (deduplication).

    const { error: insertError } = await (await supabaseAdmin as any)
      .from('story_views')
      .insert({
        story_id: storyId,
        session_id: viewSessionId,
        ip_address: ipAddress
      });

    // Check if insertion was successful (no duplicate)
    // Error code 23505 is unique_violation in Postgres
    if (!insertError) {
      console.log('New view recorded for story:', storyId);
      
      // Increment the counter since it's a new view
      const { data: currentStory } = await (await supabaseAdmin as any)
        .from('anonymous_stories')
        .select('views_count')
        .eq('id', storyId)
        .single();
        
      if (currentStory) {
        const { error: updateError } = await (await supabaseAdmin as any)
          .from('anonymous_stories')
          .update({ views_count: (currentStory.views_count || 0) + 1 })
          .eq('id', storyId);

        if (updateError) {
          console.error('Error updating view count:', updateError);
          // We logged the view but failed to update count. Partial success.
        } else {
          console.log('Successfully updated view count to:', (currentStory.views_count || 0) + 1);
        }
      }
    } else {
      // If error is unique violation, it means already viewed. Ignore.
      if (insertError.code === '23505') {
        console.log('Story already viewed by this session, skipping increment.');
      } else {
        console.error('Error recording view:', insertError);
        // Continue to return success to client to not break flow, but log error
      }
    }

    res.status(200).json({ 
      success: true, 
      message: 'View processed',
      sessionId: viewSessionId
    });

  } catch (error) {
    console.error('View tracking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
