/**
 * Comprehensive Security Middleware
 * Combines IP whitelisting, CORS, and other security controls
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withIPWhitelist, requiresIPWhitelist, getClientIP } from './ip-whitelist';
import { withCORS, shouldDisableCORS, withoutCORS } from './cors-config';

export interface SecurityMiddlewareOptions {
  requireIPWhitelist?: boolean;
  disableCORS?: boolean;
  strictCORS?: boolean;
  adminOnly?: boolean;
  logAttempts?: boolean;
}

// Define a unified handler type that can handle both void and NextApiResponse returns
type SecurityHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void | NextApiResponse<unknown>>;

// Helper function to convert between handler types
function adaptHandlerForIPWhitelist(handler: SecurityHandler): (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    await handler(req, res);
    // The handler will handle its own response, we just need to return void
    return;
  };
}

function adaptHandlerForCORS(handler: SecurityHandler): (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    await handler(req, res);
    // The handler will handle its own response, we just need to return void
    return;
  };
}

/**
 * Apply comprehensive security middleware
 */
export function withSecurity(
  handler: SecurityHandler,
  options: SecurityMiddlewareOptions = {}
): SecurityHandler {
  const {
    requireIPWhitelist = false,
    disableCORS = false,
    strictCORS = true,
    adminOnly = false,
    logAttempts = true
  } = options;

  // Build middleware chain
  let securedHandler: SecurityHandler = handler;

  // Apply IP whitelisting if required
  if (requireIPWhitelist) {
    const adaptedHandler = adaptHandlerForIPWhitelist(securedHandler);
    const ipWhitelistedHandler = withIPWhitelist(adaptedHandler, {
      adminOnly,
      logOnly: !requireIPWhitelist
    });
    securedHandler = ipWhitelistedHandler as SecurityHandler;
  }

  // Apply CORS or disable it
  if (disableCORS) {
    const adaptedHandler = adaptHandlerForCORS(securedHandler);
    securedHandler = withoutCORS(adaptedHandler) as SecurityHandler;
  } else {
    const adaptedHandler = adaptHandlerForCORS(securedHandler);
    securedHandler = withCORS(adaptedHandler, {
      strict: strictCORS,
      logAttempts
    }) as SecurityHandler;
  }

  return securedHandler;
}

/**
 * Auto-configure security based on endpoint
 */
export function withAutoSecurity(
  handler: SecurityHandler
): SecurityHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const endpoint = req.url || 'unknown';
    const clientIP = getClientIP(req);

    // Log security context
    console.log('Security Context:', {
      endpoint,
      clientIP,
      userAgent: req.headers['user-agent'],
      method: req.method,
      timestamp: new Date().toISOString()
    });

    // Determine security requirements
    const requiresIP = requiresIPWhitelist(endpoint);
    const noCORS = shouldDisableCORS(endpoint);
    const isAdminEndpoint = endpoint.includes('/admin/');

    let securedHandler: SecurityHandler = handler;

    // Apply IP whitelisting for sensitive endpoints
    if (requiresIP) {
      const adaptedHandler = adaptHandlerForIPWhitelist(securedHandler);
      const ipWhitelistedHandler = withIPWhitelist(adaptedHandler, {
        adminOnly: isAdminEndpoint,
        logOnly: false
      });
      securedHandler = ipWhitelistedHandler as SecurityHandler;
    }

    // Apply or disable CORS
    if (noCORS) {
      const adaptedHandler = adaptHandlerForCORS(securedHandler);
      securedHandler = withoutCORS(adaptedHandler) as SecurityHandler;
    } else {
      const adaptedHandler = adaptHandlerForCORS(securedHandler);
      securedHandler = withCORS(adaptedHandler, {
        strict: isAdminEndpoint,
        logAttempts: true
      }) as SecurityHandler;
    }

    // Execute secured handler
    return securedHandler(req, res);
  };
}

/**
 * Security audit logging
 */
export function logSecurityEvent(
  event: string,
  context: {
    endpoint: string;
    clientIP: string;
    userAgent?: string;
    method?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    event,
    ...context
  };

  if (context.severity === 'critical' || context.severity === 'high') {
    console.error('SECURITY ALERT:', logData);
  } else if (context.severity === 'medium') {
    console.warn('SECURITY WARNING:', logData);
  } else {
    console.log('Security Event:', logData);
  }
}

/**
 * Rate limiting for security endpoints
 */
export const securityRateLimits = {
  '/api/admin/dashboard-stats': { requests: 10, window: 60000 },  // 10 per minute
  '/api/admin/users': { requests: 5, window: 60000 },             // 5 per minute
  '/api/admin/settings': { requests: 3, window: 60000 },           // 3 per minute
  '/api/security/csp-report': { requests: 100, window: 60000 }   // 100 per minute
};

/**
 * Check if endpoint has rate limits
 */
export function getRateLimit(endpoint: string): { requests: number; window: number } | null {
  for (const [pattern, limit] of Object.entries(securityRateLimits)) {
    if (endpoint.startsWith(pattern)) {
      return limit;
    }
  }
  return null;
}

/**
 * Security health check
 */
export async function securityHealthCheck(): Promise<{
  status: 'healthy' | 'warning' | 'critical';
  checks: Record<string, boolean>;
  details: string[];
}> {
  const checks: Record<string, boolean> = {};
  const details: string[] = [];

  // Check IP whitelist configuration
  try {
    const { getIPWhitelistConfig } = await import('./ip-whitelist');
    const config = getIPWhitelistConfig();
    checks.ipWhitelist = config.enabled && config.allowedIPs.length > 0;
    if (!checks.ipWhitelist) {
      details.push('IP whitelist not properly configured');
    }
  } catch (error) {
    checks.ipWhitelist = false;
    details.push(`IP whitelist check error: ${error}`);
  }

  // Check CORS configuration
  try {
    const { getCORSConfig } = await import('./cors-config');
    const config = getCORSConfig();
    checks.corsConfig = config.enabled && config.allowedOrigins.length > 0;
    if (!checks.corsConfig) {
      details.push('CORS configuration incomplete');
    }
  } catch (error) {
    checks.corsConfig = false;
    details.push(`CORS check error: ${error}`);
  }

  // Check environment variables
  checks.environment = process.env.NODE_ENV === 'production';
  if (!checks.environment) {
    details.push('Not running in production mode');
  }

  const failedChecks = Object.values(checks).filter(check => !check).length;
  const status = failedChecks === 0 ? 'healthy' : 
                  failedChecks === 1 ? 'warning' : 'critical';

  return {
    status,
    checks,
    details
  };
}
