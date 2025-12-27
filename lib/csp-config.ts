/**
 * Content Security Policy Configuration
 * Centralized CSP management for all server components
 */

import { NextApiResponse } from 'next';

export interface CSPConfig {
  directives: Record<string, string[]>;
  reportOnly?: boolean;
}

export interface SecurityHeaders {
  'Content-Security-Policy'?: string;
  'Content-Security-Policy-Report-Only'?: string;
  'Strict-Transport-Security'?: string;
  'X-Frame-Options'?: string;
  'X-Content-Type-Options'?: string;
  'Referrer-Policy'?: string;
  'Permissions-Policy'?: string;
  'X-XSS-Protection'?: string;
  'X-Permitted-Cross-Domain-Policies'?: string;
  'Cross-Origin-Embedder-Policy'?: string;
  'Cross-Origin-Opener-Policy'?: string;
  'Cross-Origin-Resource-Policy'?: string;
  'X-CSP-Nonce'?: string;
}

/**
 * Get production CSP configuration
 */
export function getCSPConfig(reportOnly = false, isProduction = false): CSPConfig {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': isProduction ? [
      "'self'",
      'https://fonts.googleapis.com',
      'https://va.vercel-scripts.com',
      'https://upload-widget.cloudinary.com',
      'https://vercel.live',
      'blob:'
    ] : [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      'https://fonts.googleapis.com',
      'https://va.vercel-scripts.com',
      'https://upload-widget.cloudinary.com',
      'https://vercel.live',
      'blob:'
    ],
    'style-src': isProduction ? [
      "'self'",
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ] : [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://res.cloudinary.com',
      'https://*.supabase.co',
      'https://voiceofupsa.com',
      'https://*.vercel.app',
      'https://vercel.com',
      'https://fonts.gstatic.com',
      'https://www.google-analytics.com'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'data:'
    ],
    'connect-src': [
      "'self'",
      'https://api.vercel.com',
      'https://*.supabase.co',
      'https://va.vercel-scripts.com',
      'https://api.cloudinary.com',
      'https://www.google-analytics.com',
      'wss://*.supabase.co'
    ],
    'frame-src': [
      "'self'",
      'https://upload-widget.cloudinary.com',
      'https://vercel.live'
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'report-uri': ['/api/security/csp-report'],
    'report-to': ['csp-endpoint']
  };

  // Only add upgrade-insecure-requests in non-report-only mode
  if (!reportOnly) {
    directives['upgrade-insecure-requests'] = [];
  }

  return {
    directives,
    reportOnly
  };
}

/**
 * Build CSP header string from directives
 */
export function buildCSPHeader(config: CSPConfig): string {
  const directives = Object.entries(config.directives)
    .map(([directive, sources]) => {
      const sourceList = sources.length > 0 ? ` ${sources.join(' ')}` : '';
      return `${directive}${sourceList}`;
    })
    .join('; ');

  return directives;
}

/**
 * Get comprehensive security headers for production
 */
export function getSecurityHeaders(isProduction = false, nonce?: string): SecurityHeaders {
  const cspConfig = getCSPConfig(false, isProduction);
  
  if (nonce && cspConfig.directives['script-src']) {
    if (!cspConfig.directives['script-src'].includes(`'nonce-${nonce}'`)) {
      cspConfig.directives['script-src'].push(`'nonce-${nonce}'`);
    }
  }

  if (nonce && cspConfig.directives['style-src']) {
    if (!cspConfig.directives['style-src'].includes(`'nonce-${nonce}'`)) {
      cspConfig.directives['style-src'].push(`'nonce-${nonce}'`);
    }
  }

  const cspHeader = buildCSPHeader(cspConfig);

  const headers: SecurityHeaders = {};

  if (isProduction) {
    // Content Security Policy
    headers['Content-Security-Policy'] = cspHeader;

    // HTTPS enforcement - Handled by next.config.js/vercel.json for consistency
    // headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';

    // Clickjacking protection
    headers['X-Frame-Options'] = 'DENY';

    // MIME type sniffing protection
    headers['X-Content-Type-Options'] = 'nosniff';

    // Referrer policy
    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';

    // Feature policy
    headers['Permissions-Policy'] = 'microphone=(), geolocation=()';

    // XSS protection
    headers['X-XSS-Protection'] = '1; mode=block';

    // Cross-domain policies
    headers['X-Permitted-Cross-Domain-Policies'] = 'none';

    // COOP/COEP for isolation (relaxed for Cloudinary)
    headers['Cross-Origin-Embedder-Policy'] = 'unsafe-none';
    headers['Cross-Origin-Opener-Policy'] = 'same-origin';
    headers['Cross-Origin-Resource-Policy'] = 'same-origin';
  } else {
    // Development CSP (more permissive)
    const devCSPConfig = getCSPConfig(true);
    headers['Content-Security-Policy-Report-Only'] = buildCSPHeader(devCSPConfig);
  }

  return headers;
}

/**
 * Apply security headers to Next.js API response
 */
export function applySecurityHeaders(
  response: NextApiResponse,
  isProduction = false
): void {
  const headers = getSecurityHeaders(isProduction);

  Object.entries(headers).forEach(([header, value]) => {
    if (value) {
      response.setHeader(header, value);
    }
  });
}

/**
 * Apply security headers to NextResponse (middleware)
 */
export function applySecurityHeadersToResponse(
  response: Response,
  isProduction = false,
  nonce?: string
): Response {
  const headers = getSecurityHeaders(isProduction, nonce);

  Object.entries(headers).forEach(([header, value]) => {
    if (typeof value === 'string') {
      response.headers.set(header, value);
    }
  });

  return response;
}

/**
 * Validate CSP configuration
 */
export function validateCSPConfig(config: CSPConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check required directives
  const requiredDirectives = ['default-src', 'script-src', 'style-src'];
  requiredDirectives.forEach(directive => {
    if (!config.directives[directive]) {
      errors.push(`Missing required directive: ${directive}`);
    }
  });

  // Check for unsafe sources in production
  if (!config.reportOnly) {
    const unsafeDirectives = ['script-src', 'style-src'];
    unsafeDirectives.forEach(directive => {
      const sources = config.directives[directive] || [];
      if (sources.includes("'unsafe-inline'") || sources.includes("'unsafe-eval'")) {
        errors.push(`Unsafe sources in production ${directive}: ${sources.join(', ')}`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * CSP violation reporting endpoint
 */
export interface CSPViolationReport {
  'csp-report': {
    'document-uri': string;
    'referrer': string;
    'violated-directive': string;
    'original-policy': string;
    'blocked-uri': string;
    'source-file': string;
    'line-number': number;
    'column-number': number;
    'status-code': number;
  };
}

/**
 * Handle CSP violation reports
 */
export function handleCSPViolation(report: CSPViolationReport): void {
  console.warn('CSP Violation:', report['csp-report']);
  
  // In production, you might want to:
  // - Send to monitoring service
  // - Log to security dashboard
  // - Alert security team
  // - Track violation patterns
}

/**
 * Development CSP monitoring
 */
export function setupCSPMonitoring(): void {
  if (typeof window !== 'undefined') {
    // Listen for CSP violations in browser
    document.addEventListener('securitypolicyviolation', (event) => {
      console.warn('CSP Violation in browser:', {
        violatedDirective: event.violatedDirective,
        blockedURI: event.blockedURI,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber
      });
    });
  }
}
