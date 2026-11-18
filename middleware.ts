import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { aj } from "@/lib/arcjet";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Bot & Scraper Protection for API routes (Zero CPU waste on automated bots)
  if (process.env.ARCJET_KEY && pathname.startsWith("/api") && !pathname.startsWith("/api/upload")) {
    try {
      const decision = await aj.protect(request);
      if (decision.isDenied()) {
        if (decision.reason.isBot()) {
          return NextResponse.json(
            { success: false, error: "Access denied: automated scraping detected." },
            { status: 403 }
          );
        }
        if (decision.reason.isRateLimit()) {
          return NextResponse.json(
            { success: false, error: "Rate limit exceeded. Please try again shortly." },
            { status: 429 }
          );
        }
        return NextResponse.json(
          { success: false, error: "Access denied by security firewall." },
          { status: 403 }
        );
      }
    } catch (err) {
      // Fail-open defensively so legitimate traffic is never blocked if Arcjet is unavailable
      console.warn("[Arcjet Middleware] Bypass on check error:", err);
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Identify routes that actually require authentication
  const isProtectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/profile");
  const isAdminApi = pathname.startsWith("/api/admin");
  const isAuthPage = pathname.startsWith("/auth");
  const isExemptAuthPage =
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/auth/update-password");

  const needsAuth = isProtectedRoute || isAdminApi || (isAuthPage && !isExemptAuthPage);

  // Fast-path: Check if any Supabase auth cookies exist in request
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some((c) => c.name.startsWith("sb-"));

  // 3. Fast Exit for Unauthenticated Visitors on Protected Routes (Zero DB/Auth Network Calls)
  if (needsAuth && !hasAuthCookie) {
    if (isProtectedRoute) {
      const redirectUrl = new URL("/auth/login", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }
    if (isAdminApi) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Administrator credentials required." },
        { status: 401 }
      );
    }
    // If it's an auth page and user has no auth cookie, allow them through to login/register immediately
    if (isAuthPage) {
      applySecurityHeaders(response);
      return response;
    }
  }

  // 4. For Completely Public Routes without need for session validation:
  // Skip expensive remote Supabase Auth network call to conserve edge & database CPU
  if (!needsAuth) {
    applySecurityHeaders(response);
    return response;
  }

  // 5. Authenticate session only when strictly required
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Protected Dashboard / Profile RBAC
  if (isProtectedRoute) {
    if (!user) {
      const redirectUrl = new URL("/auth/login", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_admin")
      .eq("id", user.id)
      .single();

    const role = profile?.role || "public";
    const isAdmin = role === "admin" || role === "developer" || profile?.is_admin === true;

    if (pathname === "/dashboard") {
      if (isAdmin) {
        return NextResponse.redirect(new URL("/dashboard/admin", request.url));
      }
      if (role === "editor") {
        return NextResponse.redirect(new URL("/dashboard/editor", request.url));
      }
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (pathname.startsWith("/dashboard/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/dashboard/editor", request.url));
    }

    if (pathname.startsWith("/dashboard/editor") && role === "public") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Protected Admin API routes
  if (isAdminApi) {
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Administrator credentials required." },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_admin")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin" || profile?.role === "developer" || profile?.is_admin === true;
    const isStaffAllowed = pathname.startsWith("/api/admin/reviews") && (profile?.role === "editor" || isAdmin);

    if (!isAdmin && !isStaffAllowed) {
      return NextResponse.json(
        { success: false, error: "Forbidden. Administrator role required." },
        { status: 403 }
      );
    }
  }

  // Auth routes redirect if already logged in
  if (isAuthPage && !isExemptAuthPage && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Intercept expired or invalid Supabase email recovery tokens
  const authErrorCode = request.nextUrl.searchParams.get("error_code");
  const authError = request.nextUrl.searchParams.get("error");
  if (authErrorCode === "otp_expired" || authError === "access_denied") {
    const redirectUrl = new URL("/auth/forgot-password", request.url);
    redirectUrl.searchParams.set("error", "expired");
    return NextResponse.redirect(redirectUrl);
  }

  applySecurityHeaders(response);
  return response;
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://vercel.live https://*.vercel-scripts.com https://apis.google.com https://*.firebaseapp.com https://*.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://vercel.live https://fonts.gstatic.com data:; img-src 'self' http://res.cloudinary.com https://res.cloudinary.com https://vercel.com https://vercel.live https://*.vercel.com https://images.unsplash.com data: blob:; connect-src 'self' https://*.supabase.co https://*.googleapis.com https://*.firebaseio.com https://vercel.live wss://*.vercel.live ws: wss:; worker-src 'self' blob:; frame-ancestors 'none'; frame-src 'self' https://www.google.com https://maps.google.com https://vercel.live https://*.firebaseapp.com;"
  );
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|firebase-messaging-sw.js|api/upload|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
