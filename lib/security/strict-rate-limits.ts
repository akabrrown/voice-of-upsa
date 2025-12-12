// Enhanced Rate Limiting Configuration for Sensitive Endpoints
import { withRateLimit } from '@/lib/api/middleware/auth';
import { getClientIP } from '@/lib/security/auth-security';

// Ultra-strict rate limits for admin operations
export const getStrictRateLimit = (endpoint: string) => {
  const limits = {
    // Admin operations - very restrictive
    'admin-users': { requests: 5, window: 60 * 1000 }, // 5 requests per minute
    'admin-settings': { requests: 10, window: 60 * 1000 }, // 10 requests per minute
    'admin-delete': { requests: 3, window: 60 * 1000 }, // 3 requests per minute
    'admin-emergency': { requests: 2, window: 60 * 1000 }, // 2 requests per minute
    
    // User operations - moderate
    'user-profile': { requests: 20, window: 60 * 1000 }, // 20 requests per minute
    'user-delete': { requests: 3, window: 60 * 1000 }, // 3 requests per minute
    
    // Content operations - balanced
    'content-create': { requests: 10, window: 60 * 1000 }, // 10 requests per minute
    'content-update': { requests: 15, window: 60 * 1000 }, // 15 requests per minute
    
    // Upload operations - very restrictive
    'media-upload': { requests: 5, window: 60 * 1000 }, // 5 uploads per minute
    
    // Default - standard CMS limits
    'default': { requests: 100, window: 60 * 1000 }, // 100 requests per minute
  };

  return limits[endpoint as keyof typeof limits] || limits.default;
};

// Apply strict rate limiting to sensitive endpoints
export const withStrictRateLimit = (endpoint: string) => {
  const limit = getStrictRateLimit(endpoint);
  return withRateLimit(limit.requests, limit.window, (req) => getClientIP(req));
};

// Rate limit bypass for emergency situations (super admin only)
export const checkEmergencyBypass = async (req: any): Promise<boolean> => {
  // This would check for emergency bypass tokens or super admin status
  // Implementation depends on your emergency access system
  return false; // Default to no bypass
};
