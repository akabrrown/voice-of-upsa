import { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandler } from '../../../lib/api/middleware/error-handler';
import { getSupabaseClient } from '../../../lib/supabase/client';

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
    // Simple authentication check using Supabase
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

    const token = authHeader.substring(7);
    const supabase = getSupabaseClient();

    // Verify the JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.log('Auth error:', error);
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid authentication token',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    console.log('Notification preferences API - User authenticated:', user.email);

    // Return default preferences
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
      data: defaultPreferences,
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
