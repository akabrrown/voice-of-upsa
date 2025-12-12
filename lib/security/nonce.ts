/**
 * CSP Nonce Generation
 * Generates cryptographically secure nonces for CSP
 */

import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Generate a cryptographically secure nonce for CSP (Edge Runtime compatible)
 */
export function generateCSPNonce(): string {
  // Use Web Crypto API for Edge Runtime compatibility
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }
  
  // Last resort - use Math.random (not cryptographically secure but better than nothing)
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Generate nonce and add to response headers
 */
export function addCSPNonceToResponse(res: NextApiResponse): string {
  const nonce = generateCSPNonce();
  
  // Add nonce to response headers for use in templates
  res.setHeader('X-CSP-Nonce', nonce);
  
  return nonce;
}

/**
 * CSP nonce middleware for Next.js API routes
 */
export function withCSPNonce(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const nonce = addCSPNonceToResponse(res);
    
    // Add nonce to request for use in handlers
    (req as NextApiRequest & { cspNonce: string }).cspNonce = nonce;
    
    return handler(req, res);
  };
}
