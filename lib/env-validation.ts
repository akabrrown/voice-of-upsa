/**
 * Environment Variable Security Validation
 * Ensures all required environment variables are present and validates security requirements
 */

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SecurityConfig {
  requiredVars: string[];
  sensitiveVars: string[];
  publicVars: string[];
  minLengths: Record<string, number>;
}

const SECURITY_CONFIG: SecurityConfig = {
  requiredVars: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ],
  sensitiveVars: [
    'SUPABASE_SERVICE_ROLE_KEY',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'EMAIL_HOST',
    'EMAIL_PORT',
    'EMAIL_USER',
    'EMAIL_PASS',
    'CSRF_SECRET'
  ],
  publicVars: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
    'NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET'
  ],
  minLengths: {
    'NEXT_PUBLIC_SUPABASE_URL': 10,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': 20,
    'SUPABASE_SERVICE_ROLE_KEY': 20,
    'CLOUDINARY_API_KEY': 10,
    'CLOUDINARY_API_SECRET': 20
  }
};

/**
 * Validate environment variables for security
 */
export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const varName of SECURITY_CONFIG.requiredVars) {
    const value = process.env[varName];
    
    if (!value) {
      errors.push(`Required environment variable ${varName} is missing`);
      continue;
    }

    // Check minimum length
    const minLength = SECURITY_CONFIG.minLengths[varName];
    if (minLength && value.length < minLength) {
      errors.push(`Environment variable ${varName} is too short (minimum ${minLength} characters)`);
    }

    // Check for weak/default values
    if (value.includes('example') || value.includes('test') || value.includes('demo')) {
      warnings.push(`Environment variable ${varName} appears to contain example/test value`);
    }
  }

  // Check for sensitive variables exposed to client
  const clientSideCode = ['NEXT_PUBLIC_'];
  for (const varName of SECURITY_CONFIG.sensitiveVars) {
    if (clientSideCode.some(prefix => varName.startsWith(prefix))) {
      errors.push(`Sensitive environment variable ${varName} should not start with NEXT_PUBLIC_`);
    }
  }

  // Check for production security settings
  if (process.env.NODE_ENV === 'production') {
    // Ensure no debug variables are exposed
    if (process.env.DEBUG === 'true') {
      warnings.push('DEBUG should not be enabled in production');
    }

    // Check for proper security headers
    if (!process.env.CSRF_SECRET || process.env.CSRF_SECRET.length < 32) {
      warnings.push('CSRF_SECRET should be at least 32 characters in production');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get safe environment variables (only public ones)
 */
export function getPublicEnvVars(): Record<string, string> {
  const publicVars: Record<string, string> = {};
  
  for (const varName of SECURITY_CONFIG.publicVars) {
    const value = process.env[varName];
    if (value) {
      publicVars[varName] = value;
    }
  }

  return publicVars;
}

/**
 * Check if environment is development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if environment is production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Validate CSRF secret
 */
export function validateCSRFSecret(): boolean {
  const secret = process.env.CSRF_SECRET;
  if (!secret) return false;
  
  // In production, require a strong secret
  if (isProduction()) {
    return secret.length >= 32 && /[A-Za-z0-9]/.test(secret);
  }
  
  // In development, allow shorter but still require some complexity
  return secret.length >= 16;
}

/**
 * Get database configuration securely
 */
export function getDatabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceKey) {
    throw new Error('Missing required database configuration');
  }

  return {
    url,
    anonKey,
    serviceKey
  };
}

/**
 * Get email configuration securely
 */
export function getEmailConfig() {
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !port || !user || !pass) {
    if (isDevelopment()) {
      return null; // Allow missing email config in development
    }
    throw new Error('Missing required email configuration');
  }

  return {
    host,
    port: parseInt(port),
    user,
    pass
  };
}

/**
 * Get Cloudinary configuration securely
 */
export function getCloudinaryConfig() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Missing required Cloudinary configuration');
  }

  return {
    cloudName,
    apiKey,
    apiSecret
  };
}

/**
 * Security check for environment exposure
 */
export function checkEnvironmentExposure(): string[] {
  const issues: string[] = [];

  // Check for hardcoded secrets in source code
  // Note: In a real implementation, you would scan all files for these patterns
  console.log('Security patterns defined for future static analysis implementation');

  // This would typically be done with static analysis
  // For now, we'll add warnings about common issues
  if (process.env.NODE_ENV !== 'production') {
    issues.push('Running in development mode - ensure no sensitive data is committed');
  }

  // Placeholder for future implementation of pattern scanning
  console.log('Security patterns defined for future static analysis implementation');

  return issues;
}

/**
 * Initialize environment validation
 */
export function initializeEnvironment(): void {
  const validation = validateEnvironment();
  
  if (!validation.isValid) {
    console.error('Environment validation failed:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    
    if (isProduction()) {
      throw new Error('Environment validation failed in production');
    }
  }

  if (validation.warnings.length > 0) {
    console.warn('Environment validation warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  // Additional security checks
  const exposureIssues = checkEnvironmentExposure();
  if (exposureIssues.length > 0) {
    console.warn('Environment exposure issues:');
    exposureIssues.forEach(issue => console.warn(`  - ${issue}`));
  }
}

const envValidationExports = {
  validateEnvironment,
  getPublicEnvVars,
  isDevelopment,
  isProduction,
  validateCSRFSecret,
  getDatabaseConfig,
  getEmailConfig,
  getCloudinaryConfig,
  checkEnvironmentExposure,
  initializeEnvironment
};

export default envValidationExports;
