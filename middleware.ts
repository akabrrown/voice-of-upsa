import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createMiddlewareClient } from './lib/supabase/middleware-client';
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
    redirectTo: '/auth/sign-in'
  },
  '/editor': {
    roles: ['admin', 'editor'],
    redirectTo: '/auth/sign-in'
  },
  '/api/admin': {
    roles: ['admin'],
    redirectTo: '/auth/sign-in'
  },
  '/api/editor': {
    roles: ['admin', 'editor'],
    redirectTo: '/auth/sign-in'
  }
};

// Public routes that don't require authentication
const publicRoutes = [
  '/auth/sign-in',
  '/auth/sign-up',
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
  
  // Create Supabase middleware client
  const { supabase, response } = await createMiddlewareClient(request);

  // CRITICAL: Immediately skip all middleware logic for sitemap and robots
  if (pathname === '/sitemap.xml' || pathname === '/robots.txt') {
    return NextResponse.next();
  }

  // Check if route is public
  const isPublic = pathname === '/' || publicRoutes.some(route => {
    if (route === '/') return false;
    return pathname === route || pathname.startsWith(route + '/');
  });

  if (isPublic) {
    return applySecurityHeadersAndNonce(request, response);
  }

  // Check if route is protected
  const protectedRoute = Object.keys(protectedRoutes).find(route => pathname.startsWith(route)) as keyof typeof protectedRoutes | undefined;
  
  // If not protected, just continue
  if (!protectedRoute) {
    return applySecurityHeadersAndNonce(request, response);
  }

  // Verify auth session
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    const loginUrl = new URL(protectedRoutes[protectedRoute].redirectTo, request.url);
    // Preserve the original URL to redirect back after login
    loginUrl.searchParams.set('redirectTo', pathname);
    return applySecurityHeadersAndNonce(request, NextResponse.redirect(loginUrl));
  }

  // User is authenticated, now check role
  try {
    // strict check for admin/editor roles using service role to bypass RLS
    // We create a lightweight admin client just for this check
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Try users table first
    let userRole = 'user';

    const { data: userProfile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userProfile?.role) {
      userRole = userProfile.role;
    } else {
      // Fallback to user_profiles
      const { data: profileData } = await adminClient
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profileData?.role) {
        userRole = profileData.role;
      }
    }

    // Check requirements
    const requiredRoles = protectedRoutes[protectedRoute].roles;
    if (!requiredRoles.includes(userRole)) {
       // Insufficient permissions - redirect to dashboard or home
       const dashboardUrl = new URL('/', request.url);
       return applySecurityHeadersAndNonce(request, NextResponse.redirect(dashboardUrl));
    }

    // Grant access and set headers for downstream usage
    response.headers.set('x-user-role', userRole);
    response.headers.set('x-user-id', user.id);
    // Note: Permissions might be too large for headers sometimes, but minimal set is fine
    // We skip complex permissions logic here to keep middleware fast, 
    // relying on the role for the main gatekeeping.
    
    return applySecurityHeadersAndNonce(request, response);

  } catch (err) {
    console.error('Middleware auth check failed:', err);
    const loginUrl = new URL(protectedRoutes[protectedRoute].redirectTo, request.url);
    return applySecurityHeadersAndNonce(request, NextResponse.redirect(loginUrl));
  }
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
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|google3081f3b59c107589.html).*)',
  ],
};
