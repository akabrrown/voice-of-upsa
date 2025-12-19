import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken, SimpleUser } from '@/lib/simple-auth';

export function withSimpleAuth(handler: (req: NextRequest, user: SimpleUser) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      const token = getTokenFromRequest(req);
      
      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      const user = verifyToken(token);
      
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }

      return await handler(req, user);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      );
    }
  };
}

export function requireRole(requiredRole: 'admin' | 'editor' | 'user') {
  return function(handler: (req: NextRequest, user: SimpleUser) => Promise<NextResponse>) {
    return withSimpleAuth(async (req: NextRequest, user: SimpleUser) => {
      if (user.role !== requiredRole && user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
      
      return await handler(req, user);
    });
  };
}
