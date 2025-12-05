import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { authenticate, checkRole } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Validation schema for role update
const roleUpdateSchema = z.object({
  role: z.enum(['user', 'admin', 'editor'])
});

// Rate limiting: 20 requests per minute per admin
const rateLimitMiddleware = withRateLimit(20, 60 * 1000, (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  return token || req.socket.remoteAddress || 'unknown';
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Apply rate limiting
    rateLimitMiddleware(req);

    // Authenticate user
    const user = await authenticate(req);

    // Validate user ID
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_USER_ID',
          message: 'Valid user ID is required',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // PUT/PATCH - Update user role
    if (req.method === 'PUT' || req.method === 'PATCH') {
      // Authorize admin access
      if (!checkRole(user.role, ['admin'])) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Validate input
      const validatedData = roleUpdateSchema.parse(req.body);
      const { role } = validatedData;

      // Prevent admin from removing their own admin role
      if (user.id === id && role !== 'admin') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CANNOT_REMOVE_OWN_ADMIN_ROLE',
            message: 'Cannot remove your own admin role',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Get target user to ensure they exist
      const { data: targetUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('id, role, email, name')
        .eq('id', id)
        .single();

      if (fetchError || !targetUser) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            details: fetchError?.message
          },
          timestamp: new Date().toISOString()
        });
      }

      // Update user role
      const { data: updatedUser, error } = await supabaseAdmin
        .from('users')
        .update({ role })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating user role:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'USER_ROLE_UPDATE_FAILED',
            message: 'Failed to update user role',
            details: error.message
          },
          timestamp: new Date().toISOString()
        });
      }

      // Log role change
      console.info(`User role changed by admin: ${user.id}`, {
        targetUserId: id,
        targetUserEmail: targetUser.email,
        oldRole: targetUser.role,
        newRole: role,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        data: { user: updatedUser },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only PUT and PATCH methods are allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin user API error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while processing user request',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Wrap with error handler middleware
export default withErrorHandler(handler);
