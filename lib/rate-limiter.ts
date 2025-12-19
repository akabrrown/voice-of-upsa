import { NextApiRequest, NextApiResponse } from 'next';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if request is allowed based on rate limit
   */
  isAllowed(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();

    // Get or create entry for this key
    let entry = this.store[key];
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + windowMs
      };
      this.store[key] = entry;
    }

    // Check if limit exceeded
    if (entry.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }

    // Increment count
    entry.count++;
    
    return {
      allowed: true,
      remaining: Math.max(0, limit - entry.count),
      resetTime: entry.resetTime
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      const entry = this.store[key];
      if (entry && entry.resetTime < now) {
        delete this.store[key];
      }
    });
  }

  /**
   * Get IP address from request
   */
  static getClientIP(req: NextApiRequest): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
           req.headers['x-real-ip'] as string || 
           req.socket.remoteAddress || 
           'unknown';
  }

  /**
   * Get user identifier for rate limiting
   */
  static getUserIdentifier(req: NextApiRequest): string {
    // Try to get user ID from auth header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return `user:${authHeader.substring(7)}`;
    }
    
    // Fall back to IP address
    return `ip:${this.getClientIP(req)}`;
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

/**
 * Rate limiting middleware
 */
export function withRateLimit(
  limit: number,
  windowMs: number,
  keyGenerator?: (req: NextApiRequest) => string
) {
  return (req: NextApiRequest, res: NextApiResponse, next?: () => void) => {
    const key = keyGenerator ? keyGenerator(req) : RateLimiter.getUserIdentifier(req);
    const result = rateLimiter.isAllowed(key, limit, windowMs);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));

    if (!result.allowed) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests',
          details: `Rate limit of ${limit} requests per ${windowMs / 1000} seconds exceeded`
        },
        timestamp: new Date().toISOString()
      });
    }

    if (next) next();
  };
}

/**
 * Predefined rate limit configurations
 */
export const rateLimits = {
  // Strict limits for public endpoints
  contact: withRateLimit(3, 60 * 60 * 1000), // 3 requests per hour
  ads: withRateLimit(5, 60 * 60 * 1000),     // 5 requests per hour
  stories: withRateLimit(10, 60 * 60 * 1000), // 10 requests per hour
  
  // More lenient for authenticated users
  upload: withRateLimit(20, 60 * 60 * 1000),   // 20 uploads per hour
  auth: withRateLimit(10, 15 * 60 * 1000),     // 10 auth attempts per 15 minutes
  
  // Very lenient for admin users (but still limited)
  admin: withRateLimit(1000, 60 * 60 * 1000), // 1000 requests per hour
};

export default RateLimiter;
