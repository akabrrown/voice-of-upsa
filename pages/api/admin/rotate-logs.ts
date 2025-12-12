import { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { requireAdminOrEditor } from '@/lib/auth-helpers';
import { logRotationManager } from '@/lib/security/log-rotation';

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
    // Server-side role check - only admins can rotate logs
    await requireAdminOrEditor(req);

    const { action } = req.body;

    switch (action) {
      case 'statistics':
        const stats = await logRotationManager.getLogStatistics();
        return res.status(200).json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString()
        });

      case 'rotate-audit':
        const auditResult = await logRotationManager.rotateAuditLogs();
        return res.status(200).json({
          success: true,
          data: {
            type: 'audit-logs',
            ...auditResult
          },
          timestamp: new Date().toISOString()
        });

      case 'rotate-alerts':
        const alertResult = await logRotationManager.rotateSecurityAlerts();
        return res.status(200).json({
          success: true,
          data: {
            type: 'security-alerts',
            ...alertResult
          },
          timestamp: new Date().toISOString()
        });

      case 'rotate-all':
        const allResults = await logRotationManager.runAllRotations();
        return res.status(200).json({
          success: true,
          data: allResults,
          timestamp: new Date().toISOString()
        });

      default:
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: 'Invalid action specified',
            details: 'Valid actions: statistics, rotate-audit, rotate-alerts, rotate-all'
          },
          timestamp: new Date().toISOString()
        });
    }

  } catch (error) {
    console.error('Log rotation error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ROTATION_FAILED',
        message: 'Failed to perform log rotation',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

export default withErrorHandler(handler);
