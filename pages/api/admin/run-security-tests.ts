import { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { requireAdminOrEditor } from '@/lib/auth-helpers';
import { securityTester } from '@/lib/security/security-tester';

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
    // Server-side role check - only admins can run security tests
    await requireAdminOrEditor(req);

    console.info('Security testing initiated by admin', {
      timestamp: new Date().toISOString()
    });

    // Run all security tests
    const testResults = await securityTester.runAllTests();

    // Generate recommendations based on failed tests
    const criticalIssues = testResults.results.filter(r => !r.passed && r.severity === 'critical');
    const highIssues = testResults.results.filter(r => !r.passed && r.severity === 'high');

    let securityStatus = 'SECURE';
    if (criticalIssues.length > 0) {
      securityStatus = 'CRITICAL';
    } else if (highIssues.length > 0) {
      securityStatus = 'WARNING';
    }

    return res.status(200).json({
      success: true,
      data: {
        ...testResults,
        securityStatus,
        recommendations: [
          'Review and fix all failed security tests',
          'Implement regular security testing (weekly)',
          'Monitor security alerts and logs',
          'Keep dependencies updated',
          'Train team on security best practices'
        ],
        nextSteps: criticalIssues.length > 0 ? 
          'Address critical security issues immediately' : 
          'Monitor system and conduct regular tests'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Security testing error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'TESTING_FAILED',
        message: 'Failed to run security tests',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

export default withErrorHandler(handler);
