/**
 * Security Pattern Detection and Prevention
 * Comprehensive security checks for various attack vectors
 */

/**
 * Check for SQL injection patterns
 */
export const containsSqlInjection = (input) => {
  if (typeof input !== 'string') return false;
  
  const sqlPatterns = [
    /(\bOR\b|\bAND\b).*[=<>]/i,
    /UNION.*SELECT/i,
    /DROP.*TABLE/i,
    /INSERT.*INTO/i,
    /DELETE.*FROM/i,
    /UPDATE.*SET/i,
    /--/,
    /;.*DROP/i,
    /'\s*OR\s*'1'\s*=\s*'1/i,
    /admin'\s*--/i,
    /'\s*OR\s*1\s*=\s*1/i,
    /EXEC\s*\(/i,
    /xp_cmdshell/i,
    /sp_executesql/i,
    /WAITFOR\s+DELAY/i,
    /BENCHMARK\s*\(/i,
    /SLEEP\s*\(/i,
    /pg_sleep\s*\(/i
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

/**
 * Check for XSS patterns
 */
export const containsXss = (input) => {
  if (typeof input !== 'string') return false;
  
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /eval\(/gi,
    /expression\(/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /<object/gi,
    /<embed/gi,
    /<applet/gi,
    /<meta/gi,
    /<link/gi,
    /<style/gi,
    /@import/gi,
    /binding:/gi,
    /behavior:/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
};

/**
 * Check for path traversal patterns
 */
export const containsPathTraversal = (input) => {
  if (typeof input !== 'string') return false;
  
  const pathPatterns = [
    /\.\./,
    /\.\.\//,
    /\.\.\\/, 
    /%2e%2e/i,
    /\.\.\%2f/i,
    /%252e/i,
    /..\/..\/..\/etc\/passwd/i,
    /..\\..\\..\\windows\\system32/i,
    /\/etc\/passwd/i,
    /\/proc\/self\/environ/i,
    /\/windows\/system32/i
  ];
  
  return pathPatterns.some(pattern => pattern.test(input));
};

/**
 * Check for command injection patterns
 */
export const containsCommandInjection = (input) => {
  if (typeof input !== 'string') return false;
  
  const commandPatterns = [
    /;\s*rm\s+/i,
    /;\s*cat\s+/i,
    /;\s*ls\s+/i,
    /;\s*dir\s+/i,
    /\|\s*rm\s+/i,
    /\|\s*cat\s+/i,
    /\|\s*ls\s+/i,
    /\|\s*dir\s+/i,
    /&&\s*rm\s+/i,
    /&&\s*cat\s+/i,
    /&&\s*ls\s+/i,
    /&&\s*dir\s+/i,
    /`[^`]*`/,
    /\$\(.*\)/,
    /<\?.*\?>/,
    /<%.*%>/,
    /\{\{.*\}\}/
  ];
  
  return commandPatterns.some(pattern => pattern.test(input));
};

/**
 * Check for LDAP injection patterns
 */
export const containsLdapInjection = (input) => {
  if (typeof input !== 'string') return false;
  
  const ldapPatterns = [
    /\*\)/,
    /\)\(/,
    /\*\(/,
    /\)\*/,
    /\/\*/,
    /\*\//,
    /[&|!<>~]/
  ];
  
  return ldapPatterns.some(pattern => pattern.test(input));
};

/**
 * Check for NoSQL injection patterns
 */
export const containsNoSqlInjection = (input) => {
  if (typeof input !== 'string') return false;
  
  const noSqlPatterns = [
    /\$where/i,
    /\$ne/i,
    /\$in/i,
    /\$nin/i,
    /\$gt/i,
    /\$lt/i,
    /\$gte/i,
    /\$lte/i,
    /\$regex/i,
    /\$expr/i,
    /\$jsonSchema/i,
    /\$mod/i,
    /\$all/i,
    /\$size/i,
    /\$exists/i,
    /\$type/i,
    /\{.*\$.*\}/
  ];
  
  return noSqlPatterns.some(pattern => pattern.test(input));
};

/**
 * Check for XXE (XML External Entity) patterns
 */
export const containsXXE = (input) => {
  if (typeof input !== 'string') return false;
  
  const xxePatterns = [
    /<!DOCTYPE/i,
    /<!ENTITY/i,
    /&[a-zA-Z]+;/,
    /<\?xml.*\?>/i,
    /SYSTEM\s+["']/i,
    /PUBLIC\s+["']/i
  ];
  
  return xxePatterns.some(pattern => pattern.test(input));
};

/**
 * Check for SSRF (Server-Side Request Forgery) patterns
 */
export const containsSSRF = (input) => {
  if (typeof input !== 'string') return false;
  
  const ssrfPatterns = [
    /localhost/i,
    /127\.0\.0\.1/i,
    /0x7f000001/i,
    /2130706433/i,
    /017700000001/i,
    /::1/i,
    /0:0:0:0:0:0:0:1/i,
    /169\.254\./i,
    /192\.168\./i,
    /10\./i,
    /172\.(1[6-9]|2[0-9]|3[0-1])\./i,
    /file:\/\//i,
    /ftp:\/\//i,
    /gopher:\/\//i,
    /dict:\/\//i
  ];
  
  return ssrfPatterns.some(pattern => pattern.test(input));
};

/**
 * Check for deserialization attacks
 */
export const containsDeserializationAttack = (input) => {
  if (typeof input !== 'string') return false;
  
  const deserializationPatterns = [
    /O:\d+:"/i,
    /a:\d+:\{/i,
    /b:\d+;/i,
    /d:\d+;/i,
    /i:\d+;/i,
    /s:\d+:"/i,
    /C:\x00/i,
    /O:\x00/i,
    /r:\d+;/i,
    /R:\d+;/i
  ];
  
  return deserializationPatterns.some(pattern => pattern.test(input));
};

/**
 * Comprehensive input validation
 */
export const validateInput = (input, fieldName = 'Input', options = {}) => {
  if (typeof input !== 'string') {
    return { isValid: true };
  }
  
  const {
    checkSql = true,
    checkXss = true,
    checkPathTraversal = true,
    checkCommandInjection = true,
    checkLdap = false,
    checkNoSql = false,
    checkXXE = false,
    checkSSRF = false,
    checkDeserialization = false,
    maxLength = 10000
  } = options;
  
  // Check length
  if (input.length > maxLength) {
    console.warn(`Input too long in ${fieldName}: ${input.length} characters`);
    return { 
      isValid: false, 
      error: 'Input too long' 
    };
  }
  
  // Check for SQL injection
  if (checkSql && containsSqlInjection(input)) {
    console.warn(`Potential SQL injection detected in ${fieldName}`);
    return { 
      isValid: false, 
      error: 'Invalid input detected. Please check your data.' 
    };
  }
  
  // Check for XSS
  if (checkXss && containsXss(input)) {
    console.warn(`Potential XSS attack detected in ${fieldName}`);
    return { 
      isValid: false, 
      error: 'Invalid input detected. Please check your data.' 
    };
  }
  
  // Check for path traversal
  if (checkPathTraversal && containsPathTraversal(input)) {
    console.warn(`Potential path traversal detected in ${fieldName}`);
    return { 
      isValid: false, 
      error: 'Invalid input detected. Please check your data.' 
    };
  }
  
  // Check for command injection
  if (checkCommandInjection && containsCommandInjection(input)) {
    console.warn(`Potential command injection detected in ${fieldName}`);
    return { 
      isValid: false, 
      error: 'Invalid input detected. Please check your data.' 
    };
  }
  
  // Check for LDAP injection
  if (checkLdap && containsLdapInjection(input)) {
    console.warn(`Potential LDAP injection detected in ${fieldName}`);
    return { 
      isValid: false, 
      error: 'Invalid input detected. Please check your data.' 
    };
  }
  
  // Check for NoSQL injection
  if (checkNoSql && containsNoSqlInjection(input)) {
    console.warn(`Potential NoSQL injection detected in ${fieldName}`);
    return { 
      isValid: false, 
      error: 'Invalid input detected. Please check your data.' 
    };
  }
  
  // Check for XXE
  if (checkXXE && containsXXE(input)) {
    console.warn(`Potential XXE attack detected in ${fieldName}`);
    return { 
      isValid: false, 
      error: 'Invalid input detected. Please check your data.' 
    };
  }
  
  // Check for SSRF
  if (checkSSRF && containsSSRF(input)) {
    console.warn(`Potential SSRF attack detected in ${fieldName}`);
    return { 
      isValid: false, 
      error: 'Invalid input detected. Please check your data.' 
    };
  }
  
  // Check for deserialization attacks
  if (checkDeserialization && containsDeserializationAttack(input)) {
    console.warn(`Potential deserialization attack detected in ${fieldName}`);
    return { 
      isValid: false, 
      error: 'Invalid input detected. Please check your data.' 
    };
  }
  
  return { isValid: true };
};

/**
 * Validate multiple inputs
 */
export const validateMultipleInputs = (inputs, options = {}) => {
  const results = {};
  let allValid = true;
  
  for (const [fieldName, input] of Object.entries(inputs)) {
    const result = validateInput(input, fieldName, options);
    results[fieldName] = result;
    if (!result.isValid) {
      allValid = false;
    }
  }
  
  return {
    allValid,
    results
  };
};

/**
 * Get security risk level for input
 */
export const getSecurityRiskLevel = (input) => {
  if (typeof input !== 'string') return 'low';
  
  let riskScore = 0;
  
  if (containsSqlInjection(input)) riskScore += 10;
  if (containsXss(input)) riskScore += 8;
  if (containsCommandInjection(input)) riskScore += 9;
  if (containsPathTraversal(input)) riskScore += 6;
  if (containsLdapInjection(input)) riskScore += 5;
  if (containsNoSqlInjection(input)) riskScore += 5;
  if (containsXXE(input)) riskScore += 7;
  if (containsSSRF(input)) riskScore += 6;
  if (containsDeserializationAttack(input)) riskScore += 8;
  
  if (riskScore >= 8) return 'critical';
  if (riskScore >= 5) return 'high';
  if (riskScore >= 3) return 'medium';
  return 'low';
};

/**
 * Generate security report for input
 */
export const generateSecurityReport = (input, fieldName = 'Input') => {
  if (typeof input !== 'string') {
    return {
      fieldName,
      inputType: typeof input,
      riskLevel: 'low',
      issues: [],
      isValid: true
    };
  }
  
  const issues = [];
  
  if (containsSqlInjection(input)) {
    issues.push({
      type: 'SQL Injection',
      severity: 'critical',
      description: 'Potential SQL injection attack detected'
    });
  }
  
  if (containsXss(input)) {
    issues.push({
      type: 'XSS',
      severity: 'high',
      description: 'Potential Cross-Site Scripting attack detected'
    });
  }
  
  if (containsCommandInjection(input)) {
    issues.push({
      type: 'Command Injection',
      severity: 'critical',
      description: 'Potential command injection attack detected'
    });
  }
  
  if (containsPathTraversal(input)) {
    issues.push({
      type: 'Path Traversal',
      severity: 'medium',
      description: 'Potential path traversal attack detected'
    });
  }
  
  if (containsLdapInjection(input)) {
    issues.push({
      type: 'LDAP Injection',
      severity: 'medium',
      description: 'Potential LDAP injection attack detected'
    });
  }
  
  if (containsNoSqlInjection(input)) {
    issues.push({
      type: 'NoSQL Injection',
      severity: 'medium',
      description: 'Potential NoSQL injection attack detected'
    });
  }
  
  if (containsXXE(input)) {
    issues.push({
      type: 'XXE',
      severity: 'high',
      description: 'Potential XML External Entity attack detected'
    });
  }
  
  if (containsSSRF(input)) {
    issues.push({
      type: 'SSRF',
      severity: 'high',
      description: 'Potential Server-Side Request Forgery attack detected'
    });
  }
  
  if (containsDeserializationAttack(input)) {
    issues.push({
      type: 'Deserialization',
      severity: 'high',
      description: 'Potential deserialization attack detected'
    });
  }
  
  const riskLevel = getSecurityRiskLevel(input);
  
  return {
    fieldName,
    inputLength: input.length,
    riskLevel,
    issues,
    isValid: issues.length === 0
  };
};

const securityExports = {
  containsSqlInjection,
  containsXss,
  containsPathTraversal,
  containsCommandInjection,
  containsLdapInjection,
  containsNoSqlInjection,
  containsXXE,
  containsSSRF,
  containsDeserializationAttack,
  validateInput,
  validateMultipleInputs,
  getSecurityRiskLevel,
  generateSecurityReport
};

export default securityExports;
