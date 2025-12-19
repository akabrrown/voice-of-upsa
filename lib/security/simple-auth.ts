import { NextApiRequest } from 'next';
import jwt from 'jsonwebtoken';

export interface SimpleAuthUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  lastActivity: Date;
  securityLevel: 'low' | 'medium' | 'high';
}

/**
 * Validate simple JWT token from localStorage
 */
export async function validateSimpleAuthToken(token: string): Promise<SimpleAuthUser | null> {
  try {
    if (!token || token.length < 10) {
      console.log('Simple Auth: Invalid token format');
      return null;
    }

    console.log('Simple Auth: Validating token...');
    
    // Decode JWT token (simple validation)
    const decoded = jwt.decode(token) as {
      id?: string;
      sub?: string;
      email: string;
      role: string;
      permissions?: string[];
      securityLevel?: string;
    };
    
    if (!decoded || !decoded.email || !decoded.role) {
      console.log('Simple Auth: Invalid token payload');
      return null;
    }

    console.log('Simple Auth: Token validated successfully:', {
      email: decoded.email,
      role: decoded.role,
      id: decoded.id
    });

    return {
      id: (decoded.id || decoded.sub) as string,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
      lastActivity: new Date(),
      securityLevel: (decoded.securityLevel as 'low' | 'medium' | 'high') || 'medium'
    };
  } catch (error) {
    console.error('Simple Auth: Token validation failed:', error);
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromRequest(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7);
}

/**
 * Middleware to validate simple auth tokens
 */
export async function withSimpleAuth(req: NextApiRequest): Promise<SimpleAuthUser | null> {
  const token = extractTokenFromRequest(req);
  
  if (!token) {
    console.log('Simple Auth: No token provided');
    return null;
  }
  
  return await validateSimpleAuthToken(token);
}
