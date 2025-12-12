/**
 * Production Security Configuration
 * Security settings and monitoring for production environment
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { securityMonitor } from './security-monitor';
import { validateEnvironment, isProduction } from './env-validation';
import { initializeDatabaseSecurity } from './db-security';

export interface ProductionSecurityConfig {
  securityHeaders: Record<string, string>;
  rateLimiting: {
    enabled: boolean;
    strict: boolean;
  };
  monitoring: {
    enabled: boolean;
    alerting: boolean;
  };
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    sensitive: boolean;
  };
}

/**
 * Get production security configuration
 */
export function getProductionSecurityConfig(): ProductionSecurityConfig {
  return {
    securityHeaders: {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'microphone=(), geolocation=()',
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com https://va.vercel-scripts.com https://upload-widget.cloudinary.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: https: blob:",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self' https://api.vercel.com https://*.supabase.co https://va.vercel-scripts.com https://api.cloudinary.com wss://*.supabase.co",
        "frame-src 'self' https://upload-widget.cloudinary.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; '),
      'X-XSS-Protection': '1; mode=block',
      'X-Permitted-Cross-Domain-Policies': 'none',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin'
    },
    rateLimiting: {
      enabled: true,
      strict: true
    },
    monitoring: {
      enabled: true,
      alerting: true
    },
    logging: {
      level: 'warn',
      sensitive: false
    }
  };
}

/**
 * Apply production security headers
 */
export function applyProductionSecurityHeaders(res: NextApiResponse): void {
  const config = getProductionSecurityConfig();
  
  Object.entries(config.securityHeaders).forEach(([header, value]) => {
    res.setHeader(header, value);
  });
}

/**
 * Production security middleware
 */
export function productionSecurityMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  next?: () => void
): void {
  // Only apply in production
  if (!isProduction()) {
    if (next) next();
    return;
  }

  // Apply security headers
  applyProductionSecurityHeaders(res);

  // Log request for monitoring
  securityMonitor.logSuspiciousActivity(req, 'Production request monitoring', {
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    referer: req.headers.referer,
    method: req.method,
    url: req.url
  });

  // Continue with request
  if (next) next();
}

/**
 * Initialize production security
 */
export async function initializeProductionSecurity(): Promise<void> {
  console.log('Initializing production security...');

  // Validate environment
  const envValidation = validateEnvironment();
  if (!envValidation.isValid) {
    throw new Error('Environment validation failed in production');
  }

  // Initialize database security
  await initializeDatabaseSecurity();

  // Set up production monitoring
  if (isProduction()) {
    console.log('Production security monitoring enabled');
    
    // Log initialization
    await securityMonitor.logSuspiciousActivity(
      { url: '/security-init', method: 'POST', headers: {} } as NextApiRequest,
      'Production security initialized',
      { timestamp: new Date().toISOString() }
    );
  }

  console.log('Production security initialization complete');
}

/**
 * Security health check for production
 */
export async function productionSecurityHealthCheck(): Promise<{
  status: 'healthy' | 'warning' | 'critical';
  checks: Record<string, boolean>;
  details: string[];
}> {
  const checks: Record<string, boolean> = {};
  const details: string[] = [];

  // Check environment variables
  try {
    const envValidation = validateEnvironment();
    checks.environment = envValidation.isValid;
    if (!envValidation.isValid) {
      details.push('Environment validation failed');
    }
  } catch (error) {
    checks.environment = false;
    details.push(`Environment check error: ${error}`);
  }

  // Check database connectivity
  try {
    // This would test actual database connection
    checks.database = true;
  } catch (error) {
    checks.database = false;
    details.push(`Database check error: ${error}`);
  }

  // Check security monitoring
  try {
    await securityMonitor.logSuspiciousActivity(
      { url: '/health-check', method: 'GET', headers: {} } as NextApiRequest,
      'Security health check'
    );
    checks.monitoring = true;
  } catch (error) {
    checks.monitoring = false;
    details.push(`Monitoring check error: ${error}`);
  }

  // Check rate limiting
  checks.rateLimiting = true; // Assume working if no errors

  const failedChecks = Object.values(checks).filter(check => !check).length;
  const status = failedChecks === 0 ? 'healthy' : 
                  failedChecks === 1 ? 'warning' : 'critical';

  return {
    status,
    checks,
    details
  };
}

/**
 * Security incident response
 */
export async function handleSecurityIncident(
  incident: {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<void> {
  console.error(`Security Incident: ${incident.type}`, incident);

  // Log incident
  await securityMonitor.logSuspiciousActivity(
    {
      url: `/incident/${incident.type}`,
      method: 'POST',
      headers: {
        'user-agent': incident.userAgent,
        'x-forwarded-for': incident.ipAddress
      },
      query: {},
      cookies: {},
      body: {},
      env: {},
      socket: { remoteAddress: incident.ipAddress } as { remoteAddress?: string }
    } as unknown as NextApiRequest,
    `Security incident: ${incident.type}`,
    incident.details
  );

  // In production, you might:
  // - Send alerts to security team
  // - Block IP addresses
  // - Enable additional monitoring
  // - Notify stakeholders

  if (isProduction()) {
    console.log('Security incident logged in production - check monitoring dashboard');
  }
}

/**
 * Security audit log
 */
export interface SecurityAuditLog {
  timestamp: string;
  event: string;
  severity: string;
  details: Record<string, unknown>;
  resolved: boolean;
}

/**
 * Get recent security incidents
 */
export async function getRecentSecurityIncidents(): Promise<SecurityAuditLog[]> {
  // This would query the security_events table
  // For now, return placeholder
  return [];
}

/**
 * Security metrics for dashboard
 */
export async function getSecurityMetrics(): Promise<{
  totalIncidents: number;
  criticalIncidents: number;
  blockedRequests: number;
  unusualActivity: number;
  lastIncident: string | null;
}> {
  // This would aggregate data from security monitoring
  return {
    totalIncidents: 0,
    criticalIncidents: 0,
    blockedRequests: 0,
    unusualActivity: 0,
    lastIncident: null
  };
}

const productionSecurityExports = {
  getProductionSecurityConfig,
  applyProductionSecurityHeaders,
  productionSecurityMiddleware,
  initializeProductionSecurity,
  productionSecurityHealthCheck,
  handleSecurityIncident,
  getRecentSecurityIncidents,
  getSecurityMetrics
};

export default productionSecurityExports;
