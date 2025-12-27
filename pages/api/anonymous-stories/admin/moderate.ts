import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity, CMSUser } from '@/lib/security/cms-security';

async function handler(req: NextApiRequest, res: NextApiResponse, user: CMSUser) {
  const supabaseAdmin = await getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Database connection failure');
  }

  // Handle GET - Fetch pending stories
  if (req.method === 'GET') {
    const { data: pendingStories, error: fetchError } = await supabaseAdmin
      .from('anonymous_stories')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Database error fetching pending stories:', fetchError);
      return res.status(500).json({
        success: false,
        error: { code: 'FETCH_FAILED', message: 'Failed to fetch pending stories' },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      data: pendingStories || [],
      timestamp: new Date().toISOString()
    });
  }

  // Handle POST - Moderate a story
  if (req.method === 'POST') {
    const { storyId, status, featured } = req.body;

    if (!storyId || !status || !['approved', 'declined'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DATA', message: 'Invalid moderation data' },
        timestamp: new Date().toISOString()
      });
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'approved' && featured) {
      updateData.featured = true;
    }

    const { data: moderatedStory, error: updateError } = await (supabaseAdmin as any)
      .from('anonymous_stories')
      .update(updateData)
      .eq('id', storyId)
      .select()
      .single();

    if (updateError) {
      console.error('Database error moderating story:', updateError);
      return res.status(500).json({
        success: false,
        error: { code: 'UPDATE_FAILED', message: 'Failed to moderate story' },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      message: `Story ${status} successfully`,
      data: moderatedStory,
      timestamp: new Date().toISOString()
    });
  }

  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
    timestamp: new Date().toISOString()
  });
}

export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'manage:content',
  auditAction: 'anonymous_story_moderated'
}));
