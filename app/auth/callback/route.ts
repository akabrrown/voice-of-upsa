import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = (searchParams.get("type") as "recovery" | "email" | "signup" | null) || "recovery";
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const effectiveOrigin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : origin;

  // Validate next param to enforce strictly relative internal redirection (prevent Open Redirect)
  const rawNext = searchParams.get("next") ?? "/dashboard";
  const safeNext =
    rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("\\")
      ? rawNext
      : "/dashboard";

  if (code || token_hash) {
    const cookieStore = await cookies();
    const redirectResponse = NextResponse.redirect(`${effectiveOrigin}${safeNext}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options);
              } catch {
                // Ignore if in read-only mode
              }
              redirectResponse.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    let authError = null;

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      authError = error;
    } else if (token_hash) {
      const { error } = await supabase.auth.verifyOtp({ token_hash, type });
      authError = error;
    }

    if (!authError) {
      return redirectResponse;
    }

    console.error("[Auth Callback] Auth exchange failed:", authError.message);

    // If destination is password recovery, route there with error parameters
    if (safeNext.includes("/auth/update-password")) {
      const targetUrl = new URL(`${effectiveOrigin}/auth/update-password`);
      targetUrl.searchParams.set("error_description", authError.message);
      if (code) targetUrl.searchParams.set("code", code);
      if (token_hash) targetUrl.searchParams.set("token_hash", token_hash);
      return NextResponse.redirect(targetUrl.toString());
    }
  }

  // If password recovery without token, redirect to update password
  if (safeNext.includes("/auth/update-password")) {
    return NextResponse.redirect(
      `${effectiveOrigin}/auth/update-password?error_description=No+recovery+token+found`
    );
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${effectiveOrigin}/auth/auth-code-error`);
}
