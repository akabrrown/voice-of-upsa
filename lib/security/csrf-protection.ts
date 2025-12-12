// CSRF Protection Implementation
import crypto from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';

export interface CSRFToken {
  token: string;
  expiresAt: number;
}

class CSRFProtection {
  private static instance: CSRFProtection;
  private tokens = new Map<string, CSRFToken>();
  private readonly TOKEN_EXPIRY = 3600 * 1000; // 1 hour in milliseconds

  static getInstance(): CSRFProtection {
    if (!CSRFProtection.instance) {
      CSRFProtection.instance = new CSRFProtection();
    }
    return CSRFProtection.instance;
  }

  // Generate a new CSRF token
  generateToken(_sessionId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + this.TOKEN_EXPIRY;
    
    this.tokens.set(token, {
      token,
      expiresAt
    });

    // Clean up expired tokens
    this.cleanupExpiredTokens();
    
    return token;
  }

  // Validate a CSRF token
  validateToken(token: string, _sessionId?: string): boolean {
    const storedToken = this.tokens.get(token);
    
    if (!storedToken) {
      return false;
    }

    // Check if token has expired
    if (Date.now() > storedToken.expiresAt) {
      this.tokens.delete(token);
      return false;
    }

    // Token is valid, remove it after use (one-time use)
    this.tokens.delete(token);
    return true;
  }

  // Clean up expired tokens
  private cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [token, data] of this.tokens.entries()) {
      if (now > data.expiresAt) {
        this.tokens.delete(token);
      }
    }
  }

  // Get token for API response
  getTokenForRequest(req: NextApiRequest): string | null {
    // Try to get token from various sources
    const token = 
      req.headers['x-csrf-token'] ||
      (req.body as any)?._csrf ||
      req.query?._csrf ||
      req.headers['csrf-token'];

    return token || null;
  }

  // Middleware to protect routes
  protect(req: NextApiRequest): boolean {
    const token = this.getTokenForRequest(req);
    
    if (!token) {
      return false;
    }

    return this.validateToken(token);
  }

  // Generate token for frontend
  generateTokenForFrontend(): { token: string; headerName: string } {
    const token = this.generateToken('session');
    return {
      token,
      headerName: 'X-CSRF-Token'
    };
  }
}

// Export singleton instance
export const csrfProtection = CSRFProtection.getInstance();

// Helper function to add CSRF token to API responses
export const addCSRFToken = (req: NextApiRequest, res: NextApiResponse) => {
  const { token, headerName } = csrfProtection.generateTokenForFrontend();
  res.setHeader(headerName, token);
  return token;
};

// Middleware for Next.js API routes
export const withCSRFProtection = (handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Skip CSRF protection for GET requests
    if (req.method === 'GET') {
      return handler(req, res);
    }

    // Protect POST, PUT, DELETE, PATCH requests
    if (!csrfProtection.protect(req)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_INVALID',
          message: 'Invalid CSRF token',
          details: 'Please refresh the page and try again'
        },
        timestamp: new Date().toISOString()
      });
    }

    return handler(req, res);
  };
};
