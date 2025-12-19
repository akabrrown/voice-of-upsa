import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import { getClientIP } from '../../security/auth-security';

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
  timestamp: string;
  requestId: string;
}

export class AuthenticationError extends Error {
  statusCode = 401;
  code = 'AUTHENTICATION_ERROR';
  
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  statusCode = 403;
  code = 'AUTHORIZATION_ERROR';
  
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  
  constructor(message: string = 'Invalid input data') {
    super(message);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends Error {
  statusCode = 429;
  code = 'RATE_LIMIT_EXCEEDED';
  
  constructor(message: string = 'Too many requests') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends Error {
  statusCode = 500;
  code = 'DATABASE_ERROR';
  
  constructor(message: string = 'Database operation failed') {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends Error {
  statusCode = 502;
  code = 'EXTERNAL_SERVICE_ERROR';
  
  constructor(message: string = 'External service unavailable') {
    super(message);
    this.name = 'ExternalServiceError';
  }
}

// Generate unique request ID for tracking
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Enhanced error logging function
function logError(
  error: unknown, 
  req: NextApiRequest, 
  requestId: string, 
  statusCode: number
): void {
  const clientIP = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  const method = req.method;
  const url = req.url;
  
  // Log structure for better debugging and monitoring
  const logData = {
    requestId,
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    error: {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      code: error && typeof error === 'object' && 'code' in error ? (error as { code: string }).code : 'UNKNOWN',
      stack: error instanceof Error ? error.stack : undefined,
    },
    request: {
      method,
      url,
      clientIP,
      userAgent,
      headers: {
        'content-type': req.headers['content-type'],
        'authorization': req.headers.authorization ? '[REDACTED]' : undefined,
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'referer': req.headers.referer,
      },
      query: req.query,
      // Only log body in development and for non-sensitive endpoints
      body: process.env.NODE_ENV === 'development' && !url?.includes('auth') ? req.body : '[REDACTED]',
    },
    response: {
      statusCode,
    },
    security: {
      suspiciousActivity: detectSuspiciousError(error, req),
    }
  };

  // Log to console (in production, this would go to a logging service)
  console.error('API Error:', JSON.stringify(logData, null, 2));
  
  // In production, you might want to send to external logging service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Sentry, LogRocket, or other logging service
    // Sentry.captureException(error, { extra: logData });
  }
}

// Detect suspicious patterns in errors
function detectSuspiciousError(error: unknown, req: NextApiRequest): boolean {
  const errorStr = String(error).toLowerCase();
  const suspiciousPatterns = [
    'sql injection',
    'xss',
    'csrf',
    'malicious',
    'attack',
    'exploit',
    'payload',
    'script',
    'alert(',
    'javascript:',
    'data:',
    'vbscript:',
    'onload=',
    'onerror=',
  ];
  
  const userAgent = (req.headers['user-agent'] || '').toLowerCase();
  const suspiciousUA = [
    'bot',
    'crawler',
    'scanner',
    'injector',
    'exploit',
  ];
  
  return suspiciousPatterns.some(pattern => errorStr.includes(pattern)) ||
         suspiciousUA.some(pattern => userAgent.includes(pattern));
}

// Security headers for error responses
function addSecurityHeaders(res: NextApiResponse): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
}

export function withErrorHandler(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const requestId = generateRequestId();
    
    try {
      // Add request ID to headers for tracking
      res.setHeader('X-Request-ID', requestId);
      
      await handler(req, res);
    } catch (error: unknown) {
      // Log the error with comprehensive context
      const statusCode = error && typeof error === 'object' && 'statusCode' in error ? (error.statusCode as number) : 500;
      logError(error, req, requestId, statusCode);

      // Ensure we haven't already sent a response
      if (!res.writableEnded) {
        const message = error instanceof Error ? error.message : 
          (error && typeof error === 'object' && 'message' in error ? (error as { message: string }).message : 'Internal Server Error');
        const code = error && typeof error === 'object' && 'code' in error ? (error.code as string) : 'INTERNAL_SERVER_ERROR';

        // Add security headers
        addSecurityHeaders(res);

        const response: ApiErrorResponse = {
          success: false,
          error: {
            code,
            message: sanitizeErrorMessage(message, statusCode),
            details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
            requestId,
          },
          timestamp: new Date().toISOString(),
          requestId,
        };

        res.status(statusCode).json(response);
      }
    }
  };
}

// Sanitize error messages to prevent information leakage
function sanitizeErrorMessage(message: string, statusCode: number): string {
  // In production, don't expose detailed error messages for server errors
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    return 'An internal error occurred. Please try again later.';
  }
  
  // Remove potentially sensitive information
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /token/i,
    /key/i,
    /database/i,
    /sql/i,
    /internal/i,
  ];
  
  let sanitized = message;
  sensitivePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });
  
  return sanitized;
}
