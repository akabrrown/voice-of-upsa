import { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity } from '@/lib/security/cms-security';
import { requireAdminOrEditor } from '@/lib/auth-helpers';
import { runSecurityAudit } from '@/lib/security/security-auditor';

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
    // Server-side role check - only admins can run security audits
    const user = await requireAdminOrEditor(req);

    console.info(`Security audit initiated by ${user.email}`, {
      timestamp: new Date().toISOString()
    });

    // Run the comprehensive security audit
    await runSecurityAudit(req, res);

  } catch (error) {
    console.error('Security audit API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred during security audit',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'admin:security',
  auditAction: 'security_audit_performed'
}));
