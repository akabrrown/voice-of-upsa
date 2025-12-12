import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { applySecurityHeadersToResponse } from '@/lib/csp-config';
import { generateCSPNonce } from '@/lib/security/nonce';

export function proxy(request: NextRequest) {
  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host');
    
    if (protocol === 'http' && host) {
      const httpsUrl = `https://${host}${request.nextUrl.pathname}${request.nextUrl.search}`;
      return NextResponse.redirect(httpsUrl, 301);
    }
  }

  // Add security headers using centralized configuration
  const response = NextResponse.next();
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Generate nonce for CSP
  const nonce = generateCSPNonce();
  response.headers.set('X-CSP-Nonce', nonce);
  
  return applySecurityHeadersToResponse(response, isProduction);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
