import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, findUserById } from '@/lib/simple-auth';
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
    // Authenticate user using simple auth token verification
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authorization token provided',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token using simple auth (no rate limiting)
    const authUser = verifyToken(token);
    
    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Get user profile from database using simple auth (no Supabase auth calls)
    const profile = await findUserById(authUser.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_PROFILE_NOT_FOUND',
          message: 'User profile not found',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: profile
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in auth/user API:', error);
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

