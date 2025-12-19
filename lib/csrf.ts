import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import crypto from 'crypto';

// CSRF token generation and validation utilities
export class CSRFProtection {
  private static readonly CSRF_SECRET = process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production';
  private static readonly TOKEN_LENGTH = 32;
  private static readonly COOKIE_NAME = 'csrf-token';
  private static readonly HEADER_NAME = 'x-csrf-token';

  /**
   * Generate a secure CSRF token
   */
  static generateToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  /**
   * Create a signed CSRF token
   */
  static createSignedToken(): string {
    const token = this.generateToken();
    const timestamp = Date.now().toString();
    const payload = `${token}.${timestamp}`;
    const signature = crypto
      .createHmac('sha256', this.CSRF_SECRET)
      .update(payload)
      .digest('hex');
    
    return `${payload}.${signature}`;
  }

  /**
   * Verify a signed CSRF token
   */
  static verifyToken(signedToken: string): boolean {
    try {
      const [token, timestamp, signature] = signedToken.split('.');
      
      if (!token || !timestamp || !signature) {
        return false;
      }

      // Check if token is expired (24 hours)
      const tokenAge = Date.now() - parseInt(timestamp);
      if (tokenAge > 24 * 60 * 60 * 1000) {
        return false;
      }

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', this.CSRF_SECRET)
        .update(`${token}.${timestamp}`)
        .digest('hex');
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('CSRF token verification error:', error);
      return false;
    }
  }

  /**
   * Set CSRF token in HTTP-only cookie
   */
  static setCSRFCookie(res: NextApiResponse, token: string): void {
    // Set both HTTP-only cookie (for server-side validation) and accessible cookie (for client-side access)
    const httpOnlyCookie = serialize(this.COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    });
    
    const accessibleCookie = serialize(`${this.COOKIE_NAME}-client`, token, {
      httpOnly: false, // Allow JavaScript access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    });
    
    res.setHeader('Set-Cookie', [httpOnlyCookie, accessibleCookie]);
  }

  /**
   * Get CSRF token from request headers
   */
  static getTokenFromRequest(req: NextApiRequest): string | null {
    return req.headers[this.HEADER_NAME] as string || null;
  }

  /**
   * Get CSRF token from request cookies
   */
  static getTokenFromCookie(req: NextApiRequest): string | null {
    const cookies = req.cookies;
    
    // Try HTTP-only cookie first
    if (typeof cookies === 'object' && cookies !== null) {
      const token = cookies[this.COOKIE_NAME] as string || cookies[`${this.COOKIE_NAME}-client`] as string || null;
      if (token) return token;
    }

    // Fallback for older cookie parsing
    const cookieHeader = req.headers.cookie || '';
    const parsedCookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) acc[key.trim()] = value.trim();
      return acc;
    }, {} as Record<string, string>);

    return parsedCookies[this.COOKIE_NAME] || parsedCookies[`${this.COOKIE_NAME}-client`] || null;
  }

  /**
   * Middleware to protect API endpoints from CSRF attacks
   */
  static protect(req: NextApiRequest): boolean {
    // Skip CSRF protection for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method || '')) {
      return true;
    }

    // Get tokens from request
    const headerToken = this.getTokenFromRequest(req);
    const cookieToken = this.getTokenFromCookie(req);

    // Validate tokens
    if (!headerToken || !cookieToken) {
      console.warn('CSRF protection: Missing tokens');
      return false;
    }

    if (headerToken !== cookieToken) {
      console.warn('CSRF protection: Token mismatch');
      return false;
    }

    if (!this.verifyToken(cookieToken)) {
      console.warn('CSRF protection: Invalid token');
      return false;
    }

    return true;
  }

  /**
   * Middleware function to wrap API handlers
   */
  static withCSRFProtection(
    handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
  ) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      // For GET requests, generate and set a new CSRF token
      if (req.method === 'GET') {
        const token = this.createSignedToken();
        this.setCSRFCookie(res, token);
        return handler(req, res);
      }

      // For state-changing requests, verify CSRF token
      if (!this.protect(req)) {
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
  }
}

/**
 * Helper function to get CSRF token for frontend use
 */
export function getCSRFToken(): string {
  return CSRFProtection.createSignedToken();
}
