/**
 * Canonical Site URL and Auth Redirect Resolver for Voice of UPSA.
 * Ensures auth confirmation and password reset links never point to 'localhost'
 * when delivered to user emails.
 */

export function getSiteUrl(): string {
  // 1. Current browser window origin if accessed from a real public domain (prioritize active domain)
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    if (!origin.includes("localhost") && !origin.includes("127.0.0.1")) {
      return origin.replace(/\/$/, "");
    }
  }

  // 2. Explicit site URL configured in environment (production domain)
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl.replace(/\/$/, "");
  }

  // 3. Vercel deployment URL (provided in preview/production builds)
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL.replace(/\/$/, "")}`;
  }

  // 4. Fallback production canonical domain
  return "https://www.voiceofupsa.com";
}

/**
 * Generates an absolute redirect URL for Supabase Auth flows
 * (password reset, email verification, OAuth callbacks).
 */
export function getAuthRedirectUrl(path: string): string {
  const base = getSiteUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
