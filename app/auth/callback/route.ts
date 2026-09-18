import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
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

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${effectiveOrigin}${safeNext}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${effectiveOrigin}/auth/auth-code-error`);
}
