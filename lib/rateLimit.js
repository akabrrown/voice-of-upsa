/**
 * Rate Limiting Utilities
 * Comprehensive rate limiting with Redis fallback
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { query } from './db';

// Initialize Redis if available
let redis = null;
if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_URL,
    token: process.env.UPSTASH_REDIS_TOKEN,
  });
}

// Fallback to database rate limiting
class DatabaseRateLimit {
  constructor() {
    this.cache = new Map(); // In-memory fallback
  }

  async limit(identifier, config) {
    const key = `rate_limit:${identifier}`;
    const now = new Date();
    const windowMs = config.window * 1000;
    const windowStart = new Date(now.getTime() - windowMs);

    try {
      // Try database first
      const result = await query(
        `SELECT COUNT(*) as count, MAX(created_at) as last_request 
         FROM rate_limits 
         WHERE identifier = $1 AND action = $2 AND created_at > $3`,
        [identifier, config.action || 'default', windowStart]
      );

      const count = parseInt(result.rows[0]?.count || '0');
      const lastRequest = result.rows[0]?.last_request;

      // Check if limit exceeded
      if (count >= config.limit) {
        return {
          success: false,
          limit: config.limit,
          remaining: 0,
          reset: new Date(lastRequest.getTime() + windowMs)
        };
      }

      // Record new request
      await query(
        `INSERT INTO rate_limits (identifier, action, count, expires_at)
         VALUES ($1, $2, 1, $3)
         ON CONFLICT (identifier, action) 
         DO UPDATE SET 
           count = rate_limits.count + 1,
           created_at = NOW()`,
        [identifier, config.action || 'default', new Date(now.getTime() + windowMs)]
      );

      return {
        success: true,
        limit: config.limit,
        remaining: config.limit - count - 1,
        reset: new Date(now.getTime() + windowMs)
      };

    } catch (error) {
      console.error('Database rate limiting failed, using in-memory fallback:', error);
      
      // Fallback to in-memory
      const cacheKey = `${key}:${config.action || 'default'}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && cached.count >= config.limit && cached.reset > now) {
        return {
          success: false,
          limit: config.limit,
          remaining: 0,
          reset: cached.reset
        };
      }

      const newCount = (cached?.count || 0) + 1;
      this.cache.set(cacheKey, {
        count: newCount,
        reset: new Date(now.getTime() + windowMs)
      });

      return {
        success: true,
        limit: config.limit,
        remaining: config.limit - newCount,
        reset: new Date(now.getTime() + windowMs)
      };
    }
  }
}

// Rate limiters
export const loginRateLimiter = redis ? 
  new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    analytics: true,
  }) : new DatabaseRateLimit();

export const signupRateLimiter = redis ?
  new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(3, "1 h"),
    analytics: true,
  }) : new DatabaseRateLimit();

export const apiRateLimiter = redis ?
  new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(100, "1 h"),
    analytics: true,
  }) : new DatabaseRateLimit();

export const postRateLimiter = redis ?
  new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(10, "24 h"),
    analytics: true,
  }) : new DatabaseRateLimit();

export const commentRateLimiter = redis ?
  new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(20, "1 h"),
    analytics: true,
  }) : new DatabaseRateLimit();

export const contactRateLimiter = redis ?
  new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    analytics: true,
  }) : new DatabaseRateLimit();

export const passwordResetRateLimiter = redis ?
  new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(3, "1 h"),
    analytics: true,
  }) : new DatabaseRateLimit();

/**
 * Get client IP address from request
 */
export const getIdentifier = (req) => {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const cfConnectingIp = req.headers['cf-connecting-ip']; // Cloudflare
  
  let ip = 'unknown';
  
  if (forwarded) {
    ip = forwarded.split(',')[0].trim();
  } else if (realIp) {
    ip = realIp.trim();
  } else if (cfConnectingIp) {
    ip = cfConnectingIp.trim();
  } else if (req.socket) {
    ip = req.socket.remoteAddress || 'unknown';
  }
  
  // Normalize IPv6 localhost to IPv4
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  }
  
  return ip;
};

/**
 * Get user-based identifier
 */
export const getUserIdentifier = (req, userId = null) => {
  if (userId) {
    return `user:${userId}`;
  }
  
  // Try to get user from session
  if (req.session && req.session.user) {
    return `user:${req.session.user.id}`;
  }
  
  // Fallback to IP
  return `ip:${getIdentifier(req)}`;
};

/**
 * Generic rate limiting middleware
 */
export const createRateLimitMiddleware = (limiter, getIdentifierFn) => {
  return async (req, res, next) => {
    try {
      const identifier = getIdentifierFn(req);
      const { success, limit, remaining, reset } = await limiter.limit(identifier);
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(reset.getTime() / 1000).toString()
      });
      
      if (!success) {
        return res.status(429).json({
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((reset.getTime() - Date.now()) / 1000)
        });
      }
      
      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Continue without rate limiting if there's an error
      next();
    }
  };
};

/**
 * Specific rate limiting middlewares
 */
export const loginRateLimit = createRateLimitMiddleware(
  loginRateLimiter,
  (req) => `login:${getIdentifier(req)}`
);

export const signupRateLimit = createRateLimitMiddleware(
  signupRateLimiter,
  (req) => `signup:${getIdentifier(req)}`
);

export const apiRateLimit = createRateLimitMiddleware(
  apiRateLimiter,
  (req) => `api:${getIdentifier(req)}`
);

export const postRateLimit = createRateLimitMiddleware(
  postRateLimiter,
  (req) => `post:${getUserIdentifier(req)}`
);

export const commentRateLimit = createRateLimitMiddleware(
  commentRateLimiter,
  (req) => `comment:${getUserIdentifier(req)}`
);

export const contactRateLimit = createRateLimitMiddleware(
  contactRateLimiter,
  (req) => `contact:${getIdentifier(req)}`
);

export const passwordResetRateLimit = createRateLimitMiddleware(
  passwordResetRateLimiter,
  (req) => `password_reset:${getIdentifier(req)}`
);

/**
 * Custom rate limiting function
 */
export const checkRateLimit = async (identifier, limit, window, action = 'default') => {
  if (redis) {
    const limiter = new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(limit, window),
      analytics: false,
    });
    
    return await limiter.limit(`${action}:${identifier}`);
  } else {
    const dbLimiter = new DatabaseRateLimit();
    return await dbLimiter.limit(identifier, { limit, window, action });
  }
};

/**
 * Clean up old rate limit records
 */
export const cleanupOldRateLimits = async () => {
  try {
    await query('DELETE FROM rate_limits WHERE expires_at < NOW()');
    console.log('Cleaned up old rate limit records');
  } catch (error) {
    console.error('Error cleaning up rate limits:', error);
  }
};

/**
 * Get rate limit statistics
 */
export const getRateLimitStats = async () => {
  try {
    const result = await query(`
      SELECT 
        action,
        COUNT(DISTINCT identifier) as unique_users,
        SUM(count) as total_requests,
        MAX(created_at) as last_request
      FROM rate_limits 
      WHERE expires_at > NOW()
      GROUP BY action
      ORDER BY total_requests DESC
    `);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting rate limit stats:', error);
    return [];
  }
};

/**
 * Check if IP is blocked
 */
export const isIpBlocked = async (ip) => {
  try {
    const result = await query(
      'SELECT 1 FROM blocked_ips WHERE ip = $1 AND blocked_until > NOW()',
      [ip]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking if IP is blocked:', error);
    return false;
  }
};

/**
 * Block IP temporarily
 */
export const blockIp = async (ip, duration = '1 hour') => {
  try {
    await query(
      'INSERT INTO blocked_ips (ip, blocked_until) VALUES ($1, NOW() + INTERVAL $2) ON CONFLICT (ip) DO UPDATE SET blocked_until = NOW() + INTERVAL $2',
      [ip, duration]
    );
    
    console.log(`Blocked IP ${ip} for ${duration}`);
  } catch (error) {
    console.error('Error blocking IP:', error);
  }
};

/**
 * Unblock IP
 */
export const unblockIp = async (ip) => {
  try {
    await query('DELETE FROM blocked_ips WHERE ip = $1', [ip]);
    console.log(`Unblocked IP ${ip}`);
  } catch (error) {
    console.error('Error unblocking IP:', error);
  }
};

/**
 * Create blocked IPs table if it doesn't exist
 */
export const createBlockedIpTable = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS blocked_ips (
        id SERIAL PRIMARY KEY,
        ip INET NOT NULL,
        blocked_until TIMESTAMP NOT NULL,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip ON blocked_ips(ip);
      CREATE INDEX IF NOT EXISTS idx_blocked_ips_until ON blocked_ips(blocked_until);
    `);
  } catch (error) {
    console.error('Error creating blocked IPs table:', error);
  }
};

// Initialize blocked IPs table
if (process.env.NODE_ENV !== 'test') {
  createBlockedIpTable();
}

const rateLimitExports = {
  loginRateLimiter,
  signupRateLimiter,
  apiRateLimiter,
  postRateLimiter,
  commentRateLimiter,
  contactRateLimiter,
  passwordResetRateLimiter,
  getIdentifier,
  getUserIdentifier,
  createRateLimitMiddleware,
  loginRateLimit,
  signupRateLimit,
  apiRateLimit,
  postRateLimit,
  commentRateLimit,
  contactRateLimit,
  passwordResetRateLimit,
  checkRateLimit,
  cleanupOldRateLimits,
  getRateLimitStats,
  isIpBlocked,
  blockIp,
  unblockIp,
  createBlockedIpTable
};

export default rateLimitExports;
