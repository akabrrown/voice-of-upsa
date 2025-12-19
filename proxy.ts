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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token')?.value;

  // Check if route is public
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    // Apply security headers to public routes too
    const response = NextResponse.next();
    return applySecurityHeadersAndNonce(response);
  }

  // Check if route is protected and user is not authenticated
  const protectedRoute = Object.keys(protectedRoutes).find(route => pathname.startsWith(route));
  
  if (protectedRoute && !token) {
    const loginUrl = new URL(protectedRoutes[protectedRoute as keyof typeof protectedRoutes].redirectTo, request.url);
    const response = NextResponse.redirect(loginUrl);
    return applySecurityHeadersAndNonce(response);
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
        const loginUrl = new URL(protectedRoutes[protectedRoute as keyof typeof protectedRoutes].redirectTo, request.url);
        const response = NextResponse.redirect(loginUrl);
        return applySecurityHeadersAndNonce(response);
      }

      const data = await authResponse.json() as { success: boolean; user?: { id: string; role: string; permissions: string[] } };
      
      if (data.success && data.user) {
        // Check if user has required role for this route
        const requiredRoles = protectedRoutes[protectedRoute as keyof typeof protectedRoutes].roles;
        const userRole = data.user.role;
        
        if (!requiredRoles.includes(userRole)) {
          // Insufficient permissions - redirect to dashboard
          const dashboardUrl = new URL('/dashboard', request.url);
          const response = NextResponse.redirect(dashboardUrl);
          return applySecurityHeadersAndNonce(response);
        }

        // User has required role - allow access
        const response = NextResponse.next();
        
        // Add user info to headers for client-side access
        response.headers.set('x-user-role', userRole);
        response.headers.set('x-user-id', data.user.id);
        response.headers.set('x-user-permissions', JSON.stringify(data.user.permissions));
        
        return applySecurityHeadersAndNonce(response);
      } else {
        // Invalid user data - redirect to login
        const loginUrl = new URL(protectedRoutes[protectedRoute as keyof typeof protectedRoutes].redirectTo, request.url);
        const response = NextResponse.redirect(loginUrl);
        return applySecurityHeadersAndNonce(response);
      }
    } catch (error) {
      console.error('Proxy middleware auth error:', error);
      // On error, allow access but let frontend handle auth
      const response = NextResponse.next();
      return applySecurityHeadersAndNonce(response);
    }
  }

  // Default case - apply security headers and continue
  const response = NextResponse.next();
  return applySecurityHeadersAndNonce(response);
}

/**
 * Helper function to apply security headers and nonce
 */
function applySecurityHeadersAndNonce(response: NextResponse): NextResponse {
  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    const protocol = response.headers.get('x-forwarded-proto') || 'http';
    const host = response.headers.get('host');
    
    if (protocol === 'http' && host) {
      const pathname = response.headers.get('x-pathname') || '/';
      const httpsUrl = `https://${host}${pathname}`;
      return NextResponse.redirect(httpsUrl, 301);
    }
  }

  // Add security headers using centralized configuration
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Generate nonce for CSP
  const nonce = generateCSPNonce();
  response.headers.set('X-CSP-Nonce', nonce);
  
  const securedResponse = applySecurityHeadersToResponse(response, isProduction);
  
  // Ensure we return a NextResponse
  return securedResponse instanceof NextResponse ? securedResponse : response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
