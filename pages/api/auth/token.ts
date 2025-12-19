import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Try to get session directly from Supabase (no authentication required for token endpoint)
    const supabaseAdmin = await getSupabaseAdmin();
    const { data: { session }, error } = await (await supabaseAdmin as any).auth.getSession();

    if (error) {
      console.error('Session error:', error);
      return res.status(401).json({
        success: false,
        error: {
          code: 'SESSION_ERROR',
          message: 'Failed to get session',
          details: error.message
        },
        timestamp: new Date().toISOString()
      });
    }

    if (!session) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_SESSION',
          message: 'No active session found',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      token: session.access_token,
      data: {
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          user: {
            id: session.user?.id,
            email: session.user?.email,
            user_metadata: session.user?.user_metadata
          }
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Token API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while getting token',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Wrap with error handler middleware
export default withErrorHandler(handler);

