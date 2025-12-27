/**
 * CORS Security Configuration
 * Restrictive CORS policies for enhanced security
 */

import { NextApiRequest, NextApiResponse } from 'next';

export interface CORSConfig {
  enabled: boolean;
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  credentials: boolean;
  maxAge: number;
  strictMode: boolean;
}

export interface CORSContext {
  origin: string;
  method: string;
  headers: Record<string, string>;
  endpoint: string;
}

/**
 * Get CORS configuration based on environment
 */
export function getCORSConfig(): CORSConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const siteURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const envAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
    : [];
  const vercelPreviewOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  const baseAllowedOrigins = [
    siteURL,
    'https://voiceofupsa.com',
    'https://www.voiceofupsa.com',
  ];
  if (vercelPreviewOrigin) {
    baseAllowedOrigins.push(vercelPreviewOrigin);
  }
  const allowedOrigins = Array.from(new Set([...baseAllowedOrigins, ...envAllowedOrigins]));

  if (isProduction) {
    return {
      enabled: true,
      allowedOrigins,
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With'
      ],
      credentials: true,
      maxAge: 86400, // 24 hours
      strictMode: true
    };
  } else {
    // Development - more permissive
    return {
      enabled: true,
      allowedOrigins: [
        siteURL,
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001'
      ],
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-CSRF-Token'
      ],
      credentials: true,
      maxAge: 3600, // 1 hour
      strictMode: false
    };
  }
}

/**
 * Validate origin against allowed origins
 */
export function validateOrigin(origin: string, allowedOrigins: string[]): boolean {
  if (!origin) return false;
  return allowedOrigins.includes(origin);
}

/**
 * Validate method against allowed methods
 */
export function validateMethod(method: string, allowedMethods: string[]): boolean {
  return allowedMethods.includes(method.toUpperCase());
}

/**
 * Validate headers against allowed headers
 */
export function validateHeaders(
  requestHeaders: Record<string, string>,
  allowedHeaders: string[]
): boolean {
  const requestedHeaders = Object.keys(requestHeaders);
  
  return requestedHeaders.every(header => {
    const normalizedHeader = header.toLowerCase();
    return allowedHeaders.some(allowed => 
      allowed.toLowerCase() === normalizedHeader
    );
  });
}

/**
 * Build CORS headers
 */
export function buildCORSHeaders(
  context: CORSContext,
  config: CORSConfig
): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (!config.enabled) {
    return headers;
  }
  
  // Validate origin
  if (validateOrigin(context.origin, config.allowedOrigins)) {
    headers['Access-Control-Allow-Origin'] = context.origin;
  } else if (process.env.NODE_ENV !== 'production') {
    // In non-production only, allow the origin for debugging
    headers['Access-Control-Allow-Origin'] = context.origin;
    console.warn('CORS: Allowing origin in development mode:', context.origin);
  }
  
  // Allow credentials
  if (config.credentials && headers['Access-Control-Allow-Origin']) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  
  // Allowed methods
  headers['Access-Control-Allow-Methods'] = config.allowedMethods.join(', ');
  
  // Allowed headers
  headers['Access-Control-Allow-Headers'] = config.allowedHeaders.join(', ');
  
  // Max age
  headers['Access-Control-Max-Age'] = config.maxAge.toString();
  
  // Additional security headers
  if (config.strictMode) {
    headers['Vary'] = 'Origin';
    headers['Access-Control-Expose-Headers'] = 'Content-Length, Content-Range';
  }
  
  return headers;
}

/**
 * CORS middleware
 */
export function withCORS(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  options?: { strict?: boolean; logAttempts?: boolean }
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const config = getCORSConfig();
    const isStrict = options?.strict ?? config.strictMode;
    
    const context: CORSContext = {
      origin: req.headers.origin || req.headers.referer || '',
      method: req.method || 'GET',
      headers: Object.fromEntries(
        Object.entries(req.headers).filter(([unusedKey, value]) => typeof value === 'string' && unusedKey)
      ) as Record<string, string>,
      endpoint: req.url || 'unknown'
    };
    
    // Log CORS attempts in production
    if (options?.logAttempts && config.enabled) {
      console.log('CORS Request:', {
        origin: context.origin,
        method: context.method,
        endpoint: context.endpoint,
        timestamp: new Date().toISOString()
      });
    }
    
    // Handle preflight requests
    if (context.method === 'OPTIONS') {
      const corsHeaders = buildCORSHeaders(context, config);
      
      // Check if origin is allowed
      if (config.enabled && !validateOrigin(context.origin, config.allowedOrigins)) {
        if (isStrict) {
          console.warn('CORS: Preflight rejected for origin:', context.origin);
          return res.status(403).json({
            success: false,
            error: 'CORS policy violation',
            message: 'Origin not allowed'
          });
        }
      }
      
      // Set CORS headers and return 204
      Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      
      return res.status(204).end();
    }
    
    // For regular requests, apply CORS headers if needed
    if (config.enabled) {
      const corsHeaders = buildCORSHeaders(context, config);
      
      // In strict mode, block unauthorized origins
      if (isStrict && !validateOrigin(context.origin, config.allowedOrigins)) {
        console.warn('CORS: Request rejected for origin:', context.origin);
        return res.status(403).json({
          success: false,
          error: 'CORS policy violation',
          message: 'Origin not allowed'
        });
      }
      
      // Apply CORS headers
      Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    }
    
    // Continue with the handler
    return handler(req, res);
  };
}

/**
 * Remove all CORS headers (most restrictive)
 */
export function withoutCORS(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Explicitly remove any CORS headers that might be set elsewhere
    const corsHeadersToRemove = [
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Methods',
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Credentials',
      'Access-Control-Max-Age',
      'Access-Control-Expose-Headers'
    ];
    
    corsHeadersToRemove.forEach(header => {
      res.removeHeader(header);
    });
    
    // Add Same-Origin enforcement header
    res.setHeader('X-Content-Security-Policy', 'default-src \'self\'');
    
    return handler(req, res);
  };
}

/**
 * Sensitive endpoints that should have no CORS
 */
export const NO_CORS_ENDPOINTS = [
  '/api/admin/dashboard-stats',
  '/api/admin/users',
  '/api/admin/settings',
  '/api/admin/force-create-settings',
  '/api/admin/disable-rls',
  '/api/admin/create-settings-table',
  '/api/security/csp-report'
];

/**
 * Check if endpoint should have no CORS
 */
export function shouldDisableCORS(endpoint: string): boolean {
  return NO_CORS_ENDPOINTS.some(noCors => 
    endpoint.startsWith(noCors) || endpoint === noCors
  );
}
