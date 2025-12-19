import { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandler } from '../api/middleware/error-handler';
import { withSimpleAuth, SimpleAuthUser } from './simple-auth';

/**
 * Middleware to wrap API handlers with simple authentication
 */
export function withSimpleAuthMiddleware(
  handler: (req: NextApiRequest, res: NextApiResponse, user: SimpleAuthUser) => Promise<void>
) {
  return withErrorHandler(async (req: NextApiRequest, res: NextApiResponse) => {
    // Validate simple auth token
    const user = await withSimpleAuth(req);
    
    if (!user) {
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

    // Call the original handler with the authenticated user
    await handler(req, res, user);
  });
}
