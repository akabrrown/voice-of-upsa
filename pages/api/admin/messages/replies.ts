import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET method is allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid authentication token',
          details: authError?.message
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check if user is admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData, error: userError } = await (supabaseAdmin as any)
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Admin access required',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Fetch replies with admin information - simplified query without join
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: replies, error } = await (supabaseAdmin as any)
      .from('message_replies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching replies:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'REPLIES_FETCH_FAILED',
          message: 'Failed to fetch replies',
          details: error.message
        },
        timestamp: new Date().toISOString()
      });
    }

    // Transform replies and fetch admin info separately
    const transformedReplies = await Promise.all(
      (replies || []).map(async (reply: {
        id: string;
        message_id: string;
        admin_id: string;
        reply_text: string;
        reply_method: string;
        sent_at: string;
        created_at: string;
      }) => {
        // Fetch admin info separately
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: adminData } = await (supabaseAdmin as any)
          .from('users')
          .select('name, email')
          .eq('id', reply.admin_id)
          .single();

        return {
          id: reply.id,
          message_id: reply.message_id,
          admin_id: reply.admin_id,
          reply_text: reply.reply_text,
          reply_method: reply.reply_method,
          sent_at: reply.sent_at,
          created_at: reply.created_at,
          admin_name: adminData?.name || adminData?.email || 'Unknown Admin',
          admin_email: adminData?.email
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        replies: transformedReplies
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Replies API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    });
  }
}

export default withErrorHandler(handler);
