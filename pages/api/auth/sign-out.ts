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
    // Simple sign-out - just clear the token on client side
    // No Supabase auth calls to avoid rate limiting
    res.status(200).json({
      success: true,
      message: 'Sign-out successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in sign-out API:', error);
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
