/**
 * IP Whitelist Security
 * Restricts access to sensitive endpoints based on IP addresses
 */

import { NextApiRequest, NextApiResponse } from 'next';

export interface IPWhitelistConfig {
  enabled: boolean;
  allowedIPs: string[];
  allowedRanges: string[];
  adminOnly: boolean;
  logAttempts: boolean;
}

export interface SecurityContext {
  clientIP: string;
  userAgent: string;
  timestamp: Date;
  endpoint: string;
  method: string;
}

/**
 * Get IP whitelist configuration
 */
export function getIPWhitelistConfig(): IPWhitelistConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    enabled: isProduction,
    allowedIPs: [
      // Add your trusted IP addresses
      '127.0.0.1', // localhost
      '::1',       // IPv6 localhost
      // Add production admin IPs here
    ],
    allowedRanges: [
      // Add IP ranges if needed
      '10.0.0.0/8',    // Private network
      '172.16.0.0/12', // Private network
      '192.168.0.0/16', // Private network
    ],
    adminOnly: true,
    logAttempts: isProduction
  };
}

/**
 * Extract client IP from request
 */
export function getClientIP(request: {
  headers: Record<string, string | string[] | undefined>;
  connection?: { remoteAddress?: string };
  socket?: { remoteAddress?: string };
  ip?: string;
}): string {
  // Try various headers to get the real IP
  const forwardedFor = request.headers['x-forwarded-for'];
  const realIP = request.headers['x-real-ip'];
  const cfConnectingIP = request.headers['cf-connecting-ip']; // Cloudflare
  const xClientIP = request.headers['x-client-ip'];
  
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const forwardedStr = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return forwardedStr.split(',')[0].trim();
  }
  
  if (realIP) return Array.isArray(realIP) ? realIP[0] : realIP;
  if (cfConnectingIP) return Array.isArray(cfConnectingIP) ? cfConnectingIP[0] : cfConnectingIP;
  if (xClientIP) return Array.isArray(xClientIP) ? xClientIP[0] : xClientIP;
  
  // Fallback to connection IP
  return request.connection?.remoteAddress || 
         request.socket?.remoteAddress || 
         request.ip || 
         'unknown';
}

/**
 * Check if IP is in allowed range (CIDR notation)
 */
export function isIPInRange(ip: string, range: string): boolean {
  const [network, prefix] = range.split('/');
  const prefixLength = parseInt(prefix, 10);
  
  if (!network || isNaN(prefixLength)) return false;
  
  // Convert IP to 32-bit number
  const ipNum = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
  const networkNum = network.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
  
  // Create mask
  const mask = (0xFFFFFFFF << (32 - prefixLength)) >>> 0;
  
  return (ipNum & mask) === (networkNum & mask);
}

/**
 * Validate IP against whitelist
 */
export function validateIPAccess(clientIP: string, config: IPWhitelistConfig): {
  allowed: boolean;
  reason: string;
} {
  // Check if whitelist is disabled
  if (!config.enabled) {
    return { allowed: true, reason: 'Whitelist disabled' };
  }
  
  // Check exact IP matches
  if (config.allowedIPs.includes(clientIP)) {
    return { allowed: true, reason: 'Exact IP match' };
  }
  
  // Check IP range matches
  for (const range of config.allowedRanges) {
    if (isIPInRange(clientIP, range)) {
      return { allowed: true, reason: `Range match: ${range}` };
    }
  }
  
  return { allowed: false, reason: 'IP not whitelisted' };
}

/**
 * Log access attempt
 */
export function logAccessAttempt(
  context: SecurityContext,
  result: { allowed: boolean; reason: string }
): void {
  const logData = {
    timestamp: context.timestamp.toISOString(),
    ip: context.clientIP,
    userAgent: context.userAgent,
    endpoint: context.endpoint,
    method: context.method,
    allowed: result.allowed,
    reason: result.reason
  };
  
  if (result.allowed) {
    console.log('IP Whitelist Access Granted:', logData);
  } else {
    console.warn('IP Whitelist Access Denied:', logData);
  }
}

/**
 * IP whitelist middleware
 */
export function withIPWhitelist(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  options?: { adminOnly?: boolean; logOnly?: boolean }
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const config = getIPWhitelistConfig();
    const clientIP = getClientIP(req);
    
    const context: SecurityContext = {
      clientIP,
      userAgent: req.headers['user-agent'] || 'unknown',
      timestamp: new Date(),
      endpoint: req.url || 'unknown',
      method: req.method || 'unknown'
    };
    
    const validation = validateIPAccess(clientIP, config);
    
    // Log the attempt
    if (config.logAttempts) {
      logAccessAttempt(context, validation);
    }
    
    // Check if access is denied
    if (!validation.allowed) {
      if (options?.logOnly) {
        // Just log, don't block
        return handler(req, res);
      }
      
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Your IP address is not authorized to access this resource',
        code: 'IP_NOT_ALLOWED'
      });
    }
    
    // Check admin-only restriction
    if (options?.adminOnly && config.adminOnly) {
      // Additional admin verification can be added here
      // For now, just log that admin access was granted
      console.log('Admin access granted for IP:', clientIP);
    }
    
    // Continue with the handler
    return handler(req, res);
  };
}

/**
 * Sensitive endpoints that require IP whitelisting
 */
export const SENSITIVE_ENDPOINTS = [
  '/api/admin/dashboard-stats',
  '/api/admin/users',
  '/api/admin/settings',
  '/api/admin/force-create-settings',
  '/api/admin/disable-rls',
  '/api/admin/create-settings-table',
  '/api/security/csp-report',
  '/api/health'
];

/**
 * Check if endpoint requires IP whitelisting
 */
export function requiresIPWhitelist(endpoint: string): boolean {
  return SENSITIVE_ENDPOINTS.some(sensitive => 
    endpoint.startsWith(sensitive) || endpoint === sensitive
  );
}
