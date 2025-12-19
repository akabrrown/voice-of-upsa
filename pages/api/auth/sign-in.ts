import { NextApiRequest, NextApiResponse } from 'next';
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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CREDENTIALS',
          message: 'Email and password are required',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Redirect to simple-login endpoint (no Supabase auth calls to avoid rate limiting)
    res.status(307).json({
      success: false,
      error: {
        code: 'USE_SIMPLE_LOGIN',
        message: 'Please use /api/auth/simple-login endpoint',
        details: 'This endpoint has been migrated to avoid rate limiting'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in sign-in API:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        details: (error as Error).message
      },
      timestamp: new Date().toISOString()
    });
  }
}

export default withErrorHandler(handler);

