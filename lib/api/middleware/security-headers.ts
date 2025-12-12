/**
 * API Security Headers Middleware
 * Applies CSP and security headers to API routes
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { applySecurityHeaders } from '@/lib/csp-config';

/**
 * Apply security headers to API responses
 */
export function withSecurityHeaders(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Apply security headers before processing the request
    const isProduction = process.env.NODE_ENV === 'production';
    applySecurityHeaders(res, isProduction);

    // Continue with the original handler
    return handler(req, res);
  };
}

/**
 * Security headers wrapper for API routes
 */
export function applyAPISecurityHeaders(res: NextApiResponse): void {
  const isProduction = process.env.NODE_ENV === 'production';
  applySecurityHeaders(res, isProduction);
}

/**
 * CSP validation middleware
 */
export function withCSPValidation(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Check for CSP violations in headers
    const cspViolation = req.headers['content-security-policy-report-only'];
    
    if (cspViolation) {
      console.warn('CSP Violation Report:', cspViolation);
      
      // In production, you might want to:
      // - Log to security monitoring
      // - Send alerts
      // - Block suspicious requests
    }

    return withSecurityHeaders(handler)(req, res);
  };
}
