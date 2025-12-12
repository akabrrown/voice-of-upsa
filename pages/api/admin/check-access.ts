import { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity } from '@/lib/security/cms-security';

async function handler(req: NextApiRequest, res: NextApiResponse, user: { id: string; email: string; securityLevel?: string }) {
  try {
    // Only allow GET for access check
    if (req.method !== 'GET') {
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only GET method is allowed for access check',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Log admin access verification
    console.log(`Admin access verification completed`, {
      adminId: user.id,
      adminEmail: user.email,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'Admin access verified successfully',
      data: {
        role: 'admin',
        userId: user.id,
        email: user.email,
        securityLevel: user.securityLevel || 'medium',
        verified_at: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin access check API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while checking admin access',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply CMS security middleware and enhanced error handler
export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'admin:access',
  auditAction: 'admin_access_checked'
}));

