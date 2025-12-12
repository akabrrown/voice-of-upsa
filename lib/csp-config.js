/**
 * Content Security Policy Configuration
 * Centralized CSP management for all server components
 */

export function getCSPConfig(reportOnly = false) {
  const isProduction = !reportOnly;
  
  const directives = {
    'default-src': ["'self'"],
    'script-src': isProduction ? [
      "'self'",
      'https://fonts.googleapis.com',
      'https://va.vercel-scripts.com'
    ] : [
      "'self'",
      "'unsafe-inline'", // Only in development
      "'unsafe-eval'",   // Only in development
      'https://fonts.googleapis.com',
      'https://va.vercel-scripts.com',
      'https://upload-widget.cloudinary.com'
    ],
    'style-src': isProduction ? [
      "'self'",
      'https://fonts.googleapis.com'
    ] : [
      "'self'",
      "'unsafe-inline'", // Only in development
      'https://fonts.googleapis.com'
    ],
    'img-src': [
      "'self'",
      'data:',
      'https://res.cloudinary.com', // Specific Cloudinary domain instead of wildcard https:
      'blob:'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com'
    ],
    'connect-src': [
      "'self'",
      'https://api.vercel.com',
      'https://*.supabase.co',
      'https://va.vercel-scripts.com',
      'https://api.cloudinary.com',
      'wss://*.supabase.co'
    ],
    'frame-src': [
      "'self'",
      'https://upload-widget.cloudinary.com'
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
    'report-uri': ['/api/security/csp-report'],
    'report-to': ['csp-endpoint']
  };

  return {
    directives,
    reportOnly
  };
}

export function buildCSPHeader(config) {
  const directives = Object.entries(config.directives)
    .map(([directive, sources]) => {
      const sourceList = sources.length > 0 ? ` ${sources.join(' ')}` : '';
      return `${directive}${sourceList}`;
    })
    .join('; ');

  return directives;
}

export function getSecurityHeaders(isProduction = false, nonce) {
  const cspConfig = getCSPConfig(false);
  
  // Add nonce to script-src if provided
  if (nonce && cspConfig.directives['script-src']) {
    cspConfig.directives['script-src'].push(`'nonce-${nonce}'`);
  }
  
  const cspHeader = buildCSPHeader(cspConfig);

  const headers = {};

  if (isProduction) {
    // Content Security Policy
    headers['Content-Security-Policy'] = cspHeader;

    // HTTPS enforcement
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';

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

    // COOP/COEP for isolation
    headers['Cross-Origin-Embedder-Policy'] = 'require-corp';
    headers['Cross-Origin-Opener-Policy'] = 'same-origin';
    headers['Cross-Origin-Resource-Policy'] = 'same-origin';

    // Cookie security headers
    headers['Set-Cookie'] = [
      'HttpOnly',
      'Secure',
      'SameSite=Strict'
    ].join('; ');
  } else {
    // Development CSP (more permissive)
    const devCSPConfig = getCSPConfig(true);
    headers['Content-Security-Policy-Report-Only'] = buildCSPHeader(devCSPConfig);
  }

  return headers;
}

export function applySecurityHeadersToResponse(response, isProduction = false) {
  // Get nonce from response headers if available
  const nonce = response.headers.get('X-CSP-Nonce');
  const headers = getSecurityHeaders(isProduction, nonce || undefined);

  Object.entries(headers).forEach(([header, value]) => {
    if (value) {
      response.headers.set(header, value);
    }
  });

  return response;
}
