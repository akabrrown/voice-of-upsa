import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  if (host === "www.voiceofupsa.com") {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.host = "voiceofupsa.com";
    canonicalUrl.protocol = "https:";
    return NextResponse.redirect(canonicalUrl, 301);
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
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

  // 1. Protected Routes
  if (request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/profile")) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // Role-based access control (RBAC)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role || "public";

    // Root dashboard redirect
    if (request.nextUrl.pathname === "/dashboard") {
      if (role === "admin") {
        return NextResponse.redirect(new URL("/dashboard/admin", request.url));
      }
      if (role === "editor") {
        return NextResponse.redirect(new URL("/dashboard/editor", request.url));
      }
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Admin only routes
    if (request.nextUrl.pathname.startsWith("/dashboard/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard/editor", request.url));
    }

    // Editor only routes
    if (request.nextUrl.pathname.startsWith("/dashboard/editor") && role === "public") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // 1b. Protected Admin API routes (Defense-in-Depth edge check)
  if (request.nextUrl.pathname.startsWith("/api/admin")) {
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Administrator credentials required." },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Administrator role required." },
        { status: 403 }
      );
    }
  }

  // 2. Intercept expired or invalid Supabase email recovery tokens at root
  const authErrorCode = request.nextUrl.searchParams.get("error_code");
  const authError = request.nextUrl.searchParams.get("error");
  if (authErrorCode === "otp_expired" || authError === "access_denied") {
    const redirectUrl = new URL("/auth/forgot-password", request.url);
    redirectUrl.searchParams.set("error", "expired");
    return NextResponse.redirect(redirectUrl);
  }

  // 3. Auth routes redirect if logged in (exclude callback and update-password)
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
  const isExemptAuthPage =
    request.nextUrl.pathname.startsWith("/auth/callback") ||
    request.nextUrl.pathname.startsWith("/auth/update-password");

  if (isAuthPage && !isExemptAuthPage && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. Security Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Content Security Policy (allows OneSignal, Cloudinary, and Supabase)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://cdn.onesignal.com https://onesignal.com https://*.onesignal.com https://api.onesignal.com; style-src 'self' 'unsafe-inline'; img-src 'self' https://res.cloudinary.com https://onesignal.com https://*.onesignal.com https://*.os.tc data:; connect-src 'self' https://*.supabase.co https://onesignal.com https://*.onesignal.com https://api.onesignal.com https://*.os.tc ws: wss:; worker-src 'self' blob:; frame-ancestors 'none'; frame-src 'self' https://www.google.com https://maps.google.com;"
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|OneSignalSDKWorker.js|OneSignalSDK.sw.js|api/upload|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
