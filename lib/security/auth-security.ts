/**
 * Enhanced Authentication Security
 * Comprehensive security measures for login and registration
 */

import { NextApiRequest } from 'next';
import crypto from 'crypto';

export interface SecurityContext {
  clientIP: string;
  userAgent: string;
  timestamp: Date;
  endpoint: string;
  userId?: string;
  email?: string;
}

export interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDuration: number;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  sessionTimeout: number;
  enableDeviceFingerprinting: boolean;
  enableEmailVerification: boolean;
  enableSuspiciousActivityDetection: boolean;
}

export const SECURITY_CONFIG: SecurityConfig = {
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecialChars: true,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  enableDeviceFingerprinting: true,
  enableEmailVerification: true,
  enableSuspiciousActivityDetection: true
};

/**
 * In-memory storage for failed attempts (in production, use Redis/DB)
 */
const failedAttempts = new Map<string, { count: number; lastAttempt: Date; lockedUntil?: Date }>();

/**
 * Generate device fingerprint
 */
export function generateDeviceFingerprint(req: NextApiRequest): string {
  const userAgent = req.headers['user-agent'] || '';
  const acceptLanguage = req.headers['accept-language'] || '';
  const acceptEncoding = req.headers['accept-encoding'] || '';
  
  const fingerprint = crypto
    .createHash('sha256')
    .update(`${userAgent}|${acceptLanguage}|${acceptEncoding}`)
    .digest('hex');
  
  return fingerprint;
}

/**
 * Extract client IP with fallbacks
 */
export function getClientIP(req: NextApiRequest): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const cfConnectingIP = req.headers['cf-connecting-ip'];
  
  if (forwardedFor) {
    const forwardedStr = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return forwardedStr.split(',')[0].trim();
  }
  
  if (realIP) return Array.isArray(realIP) ? realIP[0] : realIP;
  if (cfConnectingIP) return Array.isArray(cfConnectingIP) ? cfConnectingIP[0] : cfConnectingIP;
  
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Enhanced password validation
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
  score: number;
} {
  const errors: string[] = [];
  let score = 0;

  // Length check
  if (password.length < SECURITY_CONFIG.passwordMinLength) {
    errors.push(`Password must be at least ${SECURITY_CONFIG.passwordMinLength} characters long`);
  } else {
    score += 20;
  }

  // Uppercase check
  if (SECURITY_CONFIG.passwordRequireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (/[A-Z]/.test(password)) {
    score += 20;
  }

  // Lowercase check
  if (SECURITY_CONFIG.passwordRequireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (/[a-z]/.test(password)) {
    score += 20;
  }

  // Numbers check
  if (SECURITY_CONFIG.passwordRequireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else if (/\d/.test(password)) {
    score += 20;
  }

  // Special characters check
  if (SECURITY_CONFIG.passwordRequireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 20;
  }

  // Common password patterns
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /admin/i,
    /letmein/i,
    /welcome/i
  ];

  const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
  if (hasCommonPattern) {
    errors.push('Password contains common patterns that are easy to guess');
    score -= 30;
  }

  return {
    isValid: errors.length === 0 && score >= 60,
    errors,
    score: Math.max(0, Math.min(100, score))
  };
}

/**
 * Check if IP is locked out
 */
export function isIPLockedOut(ip: string): boolean {
  const record = failedAttempts.get(ip);
  if (!record) return false;

  if (record.lockedUntil && record.lockedUntil > new Date()) {
    return true;
  }

  return false;
}

/**
 * Record failed attempt
 */
export function recordFailedAttempt(ip: string): {
  isLockedOut: boolean;
  remainingAttempts: number;
  lockoutDuration?: number;
} {
  const record = failedAttempts.get(ip) || { count: 0, lastAttempt: new Date() };
  record.count++;
  record.lastAttempt = new Date();

  if (record.count >= SECURITY_CONFIG.maxLoginAttempts) {
    record.lockedUntil = new Date(Date.now() + SECURITY_CONFIG.lockoutDuration);
    failedAttempts.set(ip, record);
    
    return {
      isLockedOut: true,
      remainingAttempts: 0,
      lockoutDuration: SECURITY_CONFIG.lockoutDuration
    };
  }

  failedAttempts.set(ip, record);
  
  return {
    isLockedOut: false,
    remainingAttempts: SECURITY_CONFIG.maxLoginAttempts - record.count
  };
}

/**
 * Clear failed attempts on successful login
 */
export function clearFailedAttempts(ip: string): void {
  failedAttempts.delete(ip);
}

/**
 * Detect suspicious activity
 */
export function detectSuspiciousActivity(context: SecurityContext): {
  isSuspicious: boolean;
  reasons: string[];
  riskScore: number;
} {
  const reasons: string[] = [];
  let riskScore = 0;

  // Check for rapid requests from same IP
  const recentAttempts = Array.from(failedAttempts.entries())
    .filter(([ip, record]) => 
      ip === context.clientIP && 
      Date.now() - record.lastAttempt.getTime() < 60000 // Last minute
    );

  if (recentAttempts.length > 3) {
    reasons.push('Multiple failed attempts from same IP in short time');
    riskScore += 40;
  }

  // Check for unusual user agent
  if (!context.userAgent || context.userAgent.length < 10) {
    reasons.push('Unusual or missing user agent');
    riskScore += 20;
  }

  // Check for requests from unusual locations (simplified)
  const suspiciousIPs = ['0.0.0.0', '127.0.0.1']; // Add more sophisticated geo-checking
  if (suspiciousIPs.includes(context.clientIP)) {
    reasons.push('Request from suspicious IP range');
    riskScore += 30;
  }

  // Check for timing patterns (requests at unusual hours)
  const hour = context.timestamp.getHours();
  if (hour < 6 || hour > 23) {
    reasons.push('Login attempt during unusual hours');
    riskScore += 10;
  }

  return {
    isSuspicious: riskScore > 30,
    reasons,
    riskScore
  };
}

/**
 * Log security event
 */
export function logSecurityEvent(
  event: string,
  context: SecurityContext,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
  metadata?: Record<string, any>
): void {
  const logData = {
    timestamp: context.timestamp.toISOString(),
    event,
    severity,
    clientIP: context.clientIP,
    userAgent: context.userAgent,
    endpoint: context.endpoint,
    userId: context.userId,
    email: context.email,
    ...metadata
  };

  if (severity === 'critical' || severity === 'high') {
    console.error('SECURITY ALERT:', logData);
  } else if (severity === 'medium') {
    console.warn('SECURITY WARNING:', logData);
  } else {
    console.log('Security Event:', logData);
  }
}

/**
 * Generate secure session token
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate email format with enhanced checks
 */
export function validateEmailEnhanced(email: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  }

  // Length check
  if (email.length > 254) {
    errors.push('Email address is too long');
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\+.*@/, // Email aliases with + signs
    /test.*@/i,
    /demo.*@/i,
    /temp.*@/i
  ];

  suspiciousPatterns.forEach(pattern => {
    if (pattern.test(email)) {
      errors.push('Email contains suspicious patterns');
    }
  });

  // Check for disposable email domains (simplified)
  const disposableDomains = ['tempmail.org', '10minutemail.com', 'guerrillamail.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  if (disposableDomains.some(d => domain?.includes(d))) {
    errors.push('Disposable email addresses are not allowed');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
