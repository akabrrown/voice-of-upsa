/**
 * Canonical Site URL and Auth Redirect Resolver for Voice of UPSA.
 * Ensures auth confirmation and password reset links never point to 'localhost'
 * when delivered to user emails.
 */

export function getSiteUrl(): string {
  // 1. Current browser window origin if accessed in client environment
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    if (origin && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
      return origin.replace(/\/$/, "");
    }
  }

  // 2. Explicit site URL configured in environment (production custom domain)
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    const formatted = envUrl.startsWith("http") ? envUrl : `https://${envUrl}`;
    return formatted.replace(/\/$/, "");
  }

  // 3. Vercel deployment URLs (provided in preview/production builds)
  const vercelProjectUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProjectUrl) {
    return `https://${vercelProjectUrl.replace(/\/$/, "")}`;
  }

  const vercelPublicUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercelPublicUrl) {
    return `https://${vercelPublicUrl.replace(/\/$/, "")}`;
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, "")}`;
  }

  // 4. Fallback production canonical domain
  return "https://voiceofupsa.com";
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
