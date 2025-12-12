import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: string;
}

// Simple in-memory rate limiter (for production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit(
  maxRequests: number,
  windowMs: number,
  keyGenerator: (req: NextApiRequest) => string
) {
  return (req: NextApiRequest) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return;
    }

    if (record.count >= maxRequests) {
      const error = new Error('Too many requests') as Error & { statusCode?: number; code?: string };
      error.statusCode = 429;
      error.code = 'RATE_LIMIT_EXCEEDED';
      throw error;
    }

    record.count++;
  };
}

export async function authenticate(req: NextApiRequest): Promise<AuthenticatedUser> {
  if (!supabaseAdmin) {
    const error = new Error('Supabase admin client not initialized') as Error & { statusCode?: number; code?: string };
    error.statusCode = 500;
    error.code = 'INTERNAL_ERROR';
    throw error;
  }
  
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('No authorization token provided') as Error & { statusCode?: number; code?: string };
    error.statusCode = 401;
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  const token = authHeader.replace('Bearer ', '');

  // Verify token with Supabase
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    const error = new Error('Invalid or expired token') as Error & { statusCode?: number; code?: string };
    error.statusCode = 401;
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  // Get user role from database
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    const error = new Error('User not found in database') as Error & { statusCode?: number; code?: string };
    error.statusCode = 401;
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  return {
    id: user.id,
    email: user.email,
    role: userData.role || 'user'
  };
}

export async function requireRole(req: NextApiRequest, allowedRoles: string[]): Promise<AuthenticatedUser> {
  const user = await authenticate(req);

  if (!allowedRoles.includes(user.role)) {
    const error = new Error('Insufficient permissions') as Error & { statusCode?: number; code?: string };
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  return user;
}

export function checkRole(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}

export function withAuth(
  handler: (req: NextApiRequest, res: NextApiResponse, user: AuthenticatedUser) => Promise<void> | void,
  options?: { requiredRole?: string | string[] }
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = await authenticate(req);
    
    if (options?.requiredRole) {
      const roles = Array.isArray(options.requiredRole) ? options.requiredRole : [options.requiredRole];
      if (!roles.includes(user.role)) {
        const error = new Error('Insufficient permissions') as Error & { statusCode?: number; code?: string };
        error.statusCode = 403;
        error.code = 'FORBIDDEN';
        throw error;
      }
    }

    return handler(req, res, user);
  };
}
