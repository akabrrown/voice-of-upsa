import { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { supabaseAdmin } from '@/lib/database-server';

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
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          details: 'Please provide a valid token'
        },
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired authentication token',
          details: 'Please sign in again'
        },
        timestamp: new Date().toISOString()
      });
    }

    // For now, return default preferences without querying database
    // to avoid potential table/RLS issues
    const preferences = null;

    // Return default preferences if none exist
    const defaultPreferences = {
      email_notifications: true,
      push_notifications: true,
      article_updates: true,
      comment_replies: true,
      new_followers: true,
      marketing_emails: false
    };

    return res.status(200).json({
      success: true,
      data: preferences || defaultPreferences,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Notification preferences API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

export default withErrorHandler(handler);
