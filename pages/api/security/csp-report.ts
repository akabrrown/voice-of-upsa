/**
 * CSP Violation Reporting Endpoint
 * Handles Content Security Policy violation reports
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { handleCSPViolation, CSPViolationReport } from '@/lib/csp-config';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Get the violation report
    const violationReport: CSPViolationReport = req.body;
    
    // Validate the report structure
    if (!violationReport || !violationReport['csp-report']) {
      return res.status(400).json({
        success: false,
        error: 'Invalid CSP violation report format'
      });
    }

    // Handle the violation
    handleCSPViolation(violationReport);

    // Log additional context
    console.warn('CSP Violation Details:', {
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      ipAddress: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown',
      report: violationReport['csp-report']
    });

    // Return success response
    res.status(204).end(); // No content needed for CSP reports

  } catch (error) {
    console.error('Error handling CSP violation report:', error);
    
    // Still return 204 to avoid breaking CSP reporting
    res.status(204).end();
  }
}
