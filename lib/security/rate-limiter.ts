import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import { NextResponse } from "next/server";

/**
 * Tiered In-Memory Rate Limiters (Zero external dependency overhead)
 * Protects expensive database and computational endpoints from CPU exhaustion.
 */

// Search endpoint: 30 requests per minute per IP (prevents multi-table ILIKE search flooding)
export const searchLimiter = new RateLimiterMemory({
  points: 30,
  duration: 60,
  blockDuration: 60,
});

// File uploads: 10 uploads per minute per IP (prevents storage & memory saturation)
export const uploadLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
  blockDuration: 120,
});

// User mutations (newsletter, comments, confessions, contact form): 15 per minute per IP
export const mutationLimiter = new RateLimiterMemory({
  points: 15,
  duration: 60,
  blockDuration: 60,
});

// General API protection: 120 requests per minute per IP
export const apiGeneralLimiter = new RateLimiterMemory({
  points: 120,
  duration: 60,
  blockDuration: 60,
});

export interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  resetMs?: number;
  response?: NextResponse;
}

/**
 * Extracts client IP safely from proxy and CDN headers.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "127.0.0.1"
  );
}

/**
 * Evaluates rate limit against the provided limiter.
 * Returns either allowed: true or a pre-configured 429 NextResponse with standard RFC headers.
 */
export async function checkRateLimit(
  limiter: RateLimiterMemory,
  key: string,
  points = 1
): Promise<RateLimitResult> {
  try {
    const res = await limiter.consume(key, points);
    return {
      allowed: true,
      remaining: res.remainingPoints,
      resetMs: res.msBeforeNext,
    };
  } catch (reject) {
    const res = reject as RateLimiterRes;
    const retryAfterSec = Math.max(1, Math.ceil((res?.msBeforeNext || 1000) / 1000));

    const response = NextResponse.json(
      {
        success: false,
        error: "Too many requests. Please slow down and try again shortly.",
        retryAfter: retryAfterSec,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Limit": String(limiter.points),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Date.now() + (res?.msBeforeNext || 1000)),
        },
      }
    );

    return {
      allowed: false,
      remaining: 0,
      resetMs: res?.msBeforeNext,
      response,
    };
  }
}
