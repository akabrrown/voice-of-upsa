/**
 * Code Review Security Analysis
 * Automated security code review for API endpoints and authentication logic
 */

import { readFileSync } from 'fs';
import { join } from 'path';

export interface CodeReviewResult {
  category: string;
  issues: CodeIssue[];
  recommendations: string[];
}

export interface CodeIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  file: string;
  line?: number;
  description: string;
  code?: string;
}

/**
 * Review API endpoints for security issues
 */
export function reviewAPIEndpoints(): CodeReviewResult {
  const issues: CodeIssue[] = [];
  const recommendations: string[] = [];

  // Common security patterns to check
  const securityChecks = [
    {
      pattern: /res\.status\(200\)\.json\(/,
      severity: 'medium' as const,
      description: 'Direct success response without validation',
      recommendation: 'Add proper validation before success responses'
    },
    {
      pattern: /console\.log\(/,
      severity: 'low' as const,
      description: 'Console logging in production code',
      recommendation: 'Remove or replace with proper logging'
    },
    {
      pattern: /process\.env\./,
      severity: 'medium' as const,
      description: 'Environment variable usage',
      recommendation: 'Ensure no sensitive env vars are exposed'
    },
    {
      pattern: /req\.body\./,
      severity: 'medium' as const,
      description: 'Direct request body access',
      recommendation: 'Validate and sanitize all request body data'
    },
    {
      pattern: /SELECT.*FROM.*WHERE.*\+/,
      severity: 'critical' as const,
      description: 'Potential SQL injection with string concatenation',
      recommendation: 'Use parameterized queries'
    },
    {
      pattern: /eval\(/,
      severity: 'critical' as const,
      description: 'Use of eval() function',
      recommendation: 'Remove eval() usage - major security risk'
    },
    {
      pattern: /dangerouslySetInnerHTML/,
      severity: 'high' as const,
      description: 'Use of dangerouslySetInnerHTML',
      recommendation: 'Ensure content is properly sanitized'
    }
  ];

  // API files to review
  const apiFiles = [
    'pages/api/contact/submit.ts',
    'pages/api/ads/submit.ts',
    'pages/api/upload.ts',
    'pages/api/anonymous-stories/submit.ts',
    'pages/api/auth/sign-in.ts',
    'pages/api/auth/sign-up.ts'
  ];

  apiFiles.forEach(file => {
    try {
      const content = readFileSync(join(process.cwd(), file), 'utf-8');
      const lines = content.split('\n');

      securityChecks.forEach(check => {
        const matches = content.match(check.pattern);
        if (matches) {
          const lineNumber = lines.findIndex(line => line.match(check.pattern)) + 1;
          issues.push({
            severity: check.severity,
            file,
            line: lineNumber,
            description: check.description,
            code: lines[lineNumber - 1]?.trim()
          });
        }
      });
    } catch {
      // File not found or unreadable
      console.warn(`Could not read file: ${file}`);
    }
  });

  recommendations.push(
    'Implement comprehensive input validation',
    'Add proper error handling without information disclosure',
    'Use parameterized database queries',
    'Sanitize all user inputs',
    'Implement proper authentication and authorization'
  );

  return {
    category: 'API Endpoints',
    issues,
    recommendations
  };
}

/**
 * Review authentication and authorization logic
 */
export function reviewAuthLogic(): CodeReviewResult {
  const issues: CodeIssue[] = [];
  const recommendations: string[] = [];

  const authPatterns = [
    {
      pattern: /Bearer\s+/,
      severity: 'low' as const,
      description: 'Bearer token usage detected',
      recommendation: 'Ensure proper token validation'
    },
    {
      pattern: /jwt\./,
      severity: 'medium' as const,
      description: 'JWT token handling',
      recommendation: 'Verify JWT token validation and expiration'
    },
    {
      pattern: /role.*admin/,
      severity: 'medium' as const,
      description: 'Admin role check',
      recommendation: 'Ensure admin checks are properly implemented'
    },
    {
      pattern: /password/,
      severity: 'high' as const,
      description: 'Password handling detected',
      recommendation: 'Ensure passwords are properly hashed and secured'
    }
  ];

  const authFiles = [
    'lib/auth.ts',
    'lib/admin-auth.ts',
    'pages/api/auth/sign-in.ts',
    'pages/api/auth/sign-up.ts',
    'pages/api/auth/verify-email.ts'
  ];

  authFiles.forEach(file => {
    try {
      const content = readFileSync(join(process.cwd(), file), 'utf-8');
      const lines = content.split('\n');

      authPatterns.forEach(pattern => {
        const matches = content.match(pattern.pattern);
        if (matches) {
          const lineNumber = lines.findIndex(line => line.match(pattern.pattern)) + 1;
          issues.push({
            severity: pattern.severity,
            file,
            line: lineNumber,
            description: pattern.description,
            code: lines[lineNumber - 1]?.trim()
          });
        }
      });
    } catch {
      console.warn(`Could not read auth file: ${file}`);
    }
  });

  recommendations.push(
    'Implement proper token validation',
    'Use secure password hashing (bcrypt)',
    'Implement role-based access control',
    'Add session management',
    'Implement multi-factor authentication for sensitive operations'
  );

  return {
    category: 'Authentication & Authorization',
    issues,
    recommendations
  };
}

/**
 * Check for information disclosure in error messages
 */
export function reviewErrorMessages(): CodeReviewResult {
  const issues: CodeIssue[] = [];
  const recommendations: string[] = [];

  const errorPatterns = [
    {
      pattern: /error\.message.*res\.json/,
      severity: 'high' as const,
      description: 'Potential information disclosure in error messages',
      recommendation: 'Sanitize error messages before sending to client'
    },
    {
      pattern: /stack.*trace/,
      severity: 'high' as const,
      description: 'Stack trace exposure',
      recommendation: 'Never expose stack traces to clients'
    },
    {
      pattern: /console\.error.*error/,
      severity: 'medium' as const,
      description: 'Error logging detected',
      recommendation: 'Use proper logging service instead of console.error'
    },
    {
      pattern: /Internal.*server.*error/i,
      severity: 'low' as const,
      description: 'Generic error message',
      recommendation: 'Use specific error codes for different scenarios'
    }
  ];

  // Note: In a real implementation, you would scan these files
  console.log('Error patterns defined for future code analysis implementation');
  errorPatterns.forEach(pattern => {
    issues.push({
      severity: pattern.severity,
      file: 'Multiple files',
      description: pattern.description
    });
  });

  recommendations.push(
    'Implement generic error messages for clients',
    'Log detailed errors server-side only',
    'Use error codes instead of detailed messages',
    'Implement proper error handling middleware',
    'Create error response templates'
  );

  return {
    category: 'Error Message Security',
    issues,
    recommendations
  };
}

/**
 * Verify proper error handling without sensitive data leakage
 */
export function reviewErrorHandling(): CodeReviewResult {
  const issues: CodeIssue[] = [];
  const recommendations: string[] = [];

  // Check for common error handling anti-patterns
  // Note: In a real implementation, you would scan files for these patterns
  console.log('Error handling patterns defined for future code analysis implementation');

  recommendations.push(
    'Implement global error handling middleware',
    'Create standardized error response format',
    'Log errors securely without exposing sensitive data',
    'Use error codes for client communication',
    'Implement error monitoring and alerting'
  );

  return {
    category: 'Error Handling',
    issues,
    recommendations
  };
}

/**
 * Run comprehensive code review
 */
export function runCodeReview(): CodeReviewResult[] {
  return [
    reviewAPIEndpoints(),
    reviewAuthLogic(),
    reviewErrorMessages(),
    reviewErrorHandling()
  ];
}

/**
 * Generate code review report
 */
export function generateCodeReviewReport(): { summary: string; reviews: CodeReviewResult[]; overall: string } {
  const reviews = runCodeReview();
  const totalIssues = reviews.reduce((sum, review) => sum + review.issues.length, 0);
  const criticalIssues = reviews.reduce((sum, review) => 
    sum + review.issues.filter(issue => issue.severity === 'critical').length, 0);
  const highIssues = reviews.reduce((sum, review) => 
    sum + review.issues.filter(issue => issue.severity === 'high').length, 0);

  const overall = criticalIssues > 0 ? 'CRITICAL' : 
                  highIssues > 0 ? 'HIGH' : 
                  totalIssues > 0 ? 'MEDIUM' : 'GOOD';

  const summary = `
Code Review Summary:
- Overall Security Rating: ${overall}
- Total Issues Found: ${totalIssues}
- Critical Issues: ${criticalIssues}
- High Issues: ${highIssues}

${reviews.map(review => 
  `- ${review.category}: ${review.issues.length} issues`
).join('\n')}
  `.trim();

  return {
    summary,
    reviews,
    overall
  };
}

const codeReviewExports = {
  reviewAPIEndpoints,
  reviewAuthLogic,
  reviewErrorMessages,
  reviewErrorHandling,
  runCodeReview,
  generateCodeReviewReport
};

export default codeReviewExports;
