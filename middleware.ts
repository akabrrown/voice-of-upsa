import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { applySecurityHeadersToResponse } from './lib/csp-config';
import { generateCSPNonce } from './lib/security/nonce';

/**
 * Combined Proxy Middleware for Next.js 16
 * Handles both security headers and CMS route protection
 */

// Define protected routes and required roles
const protectedRoutes = {
  '/admin': {
    roles: ['admin'],
    redirectTo: '/auth/login'
  },
  '/editor': {
    roles: ['admin', 'editor'],
    redirectTo: '/auth/login'
  },
  '/api/admin': {
    roles: ['admin'],
    redirectTo: '/auth/login'
  },
  '/api/editor': {
    roles: ['admin', 'editor'],
    redirectTo: '/auth/login'
  }
};

// Public routes that don't require authentication
const publicRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/api/auth/sign-in',
  '/api/auth/sign-up',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/cms-user',
  '/',
  '/articles',
  '/api/articles',
  '/api/search'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token')?.value;

  // Check if route is public
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    const response = NextResponse.next();
    return applySecurityHeadersAndNonce(request, response);
  }

  // Check if route is protected and user is not authenticated
  const protectedRoute = Object.keys(protectedRoutes).find(route => pathname.startsWith(route)) as keyof typeof protectedRoutes | undefined;
  
  if (protectedRoute && !token) {
    const loginUrl = new URL(protectedRoutes[protectedRoute].redirectTo, request.url);
    const response = NextResponse.redirect(loginUrl);
    return applySecurityHeadersAndNonce(request, response);
  }

  // For protected routes, we need to verify the token and user role
  if (protectedRoute && token) {
    try {
      // Verify token with Supabase
      const authResponse = await fetch(`${request.nextUrl.origin}/api/auth/cms-user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!authResponse.ok) {
        // Invalid token - redirect to login
        const loginUrl = new URL(protectedRoutes[protectedRoute].redirectTo, request.url);
        const response = NextResponse.redirect(loginUrl);
        return applySecurityHeadersAndNonce(request, response);
      }

      const data = await authResponse.json() as { success: boolean; user?: { id: string; role: string; permissions: string[] } };
      
      if (data.success && data.user) {
        // Check if user has required role for this route
        const requiredRoles = protectedRoutes[protectedRoute].roles;
        const userRole = data.user.role;
        
        if (!requiredRoles.includes(userRole)) {
          // Insufficient permissions - redirect to dashboard
          const dashboardUrl = new URL('/dashboard', request.url);
          const response = NextResponse.redirect(dashboardUrl);
          return applySecurityHeadersAndNonce(request, response);
        }

        // User has required role - allow access
        const response = NextResponse.next();
        
        // Add user info to headers for client-side access
        response.headers.set('x-user-role', userRole);
        response.headers.set('x-user-id', data.user.id);
        response.headers.set('x-user-permissions', JSON.stringify(data.user.permissions));
        
        return applySecurityHeadersAndNonce(request, response);
      } else {
        // Invalid user data - redirect to login
        const loginUrl = new URL(protectedRoutes[protectedRoute].redirectTo, request.url);
        const response = NextResponse.redirect(loginUrl);
        return applySecurityHeadersAndNonce(request, response);
      }
    } catch (error) {
      console.error('Middleware auth error:', error);
      // On error, allow access but let frontend handle auth
      const response = NextResponse.next();
      return applySecurityHeadersAndNonce(request, response);
    }
  }

  // Default case - apply security headers and continue
  const response = NextResponse.next();
  return applySecurityHeadersAndNonce(request, response);
}

/**
 * Helper function to apply security headers and nonce
 */
function applySecurityHeadersAndNonce(request: NextRequest, response: NextResponse): NextResponse {
  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host');
    
    if (protocol === 'http' && host && !host.includes('localhost')) {
      const httpsUrl = `https://${host}${request.nextUrl.pathname}${request.nextUrl.search}`;
      return NextResponse.redirect(httpsUrl, 301);
    }
  }

  // Add security headers using centralized configuration
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Generate nonce for CSP
  const nonce = generateCSPNonce();
  
  // Set nonce on request and response so it's available in _document or other SSR components
  response.headers.set('X-Nonce', nonce); 
  request.headers.set('X-Nonce', nonce); 
  
  const securedResponse = applySecurityHeadersToResponse(response, isProduction, nonce);
  
  // Explicitly set HSTS in middleware as a fail-safe
  if (isProduction) {
    securedResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  return securedResponse as NextResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
