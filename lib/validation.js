/**
 * Input Validation Utilities
 * Comprehensive validation for all user inputs
 */

import validator from 'validator';

/**
 * Validate email address
 */
export const validateEmail = (email) => {
  if (!email || !validator.isEmail(email)) {
    return { isValid: false, error: 'Invalid email address' };
  }
  
  // Additional checks
  if (email.length > 255) {
    return { isValid: false, error: 'Email too long' };
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\+\s*@/,  // Plus sign before @
    /@.*@/,   // Multiple @ symbols
    /\.\./,   // Double dots
    /--/      // Double dashes
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(email))) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  return { isValid: true };
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }
  
  if (password.length > 128) {
    return { isValid: false, error: 'Password too long' };
  }
  
  // Check for at least one uppercase, one lowercase, one number
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }
  
  // Check for special characters (optional but recommended)
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character' };
  }
  
  // Check for common weak passwords
  const commonPasswords = [
    'password', '12345678', 'qwerty123', 'admin123', 
    'password123', 'letmein', 'welcome', 'monkey'
  ];
  
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    return { isValid: false, error: 'Password is too common' };
  }
  
  return { isValid: true };
};

/**
 * Validate name field
 */
export const validateName = (name) => {
  if (!name || validator.isEmpty(name.trim())) {
    return { isValid: false, error: 'Name is required' };
  }
  
  if (!validator.isLength(name, { min: 2, max: 100 })) {
    return { isValid: false, error: 'Name must be between 2 and 100 characters' };
  }
  
  // Only allow letters, spaces, hyphens, apostrophes
  if (!/^[a-zA-Z\s\-']+$/.test(name)) {
    return { isValid: false, error: 'Name contains invalid characters' };
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /script/i,
    /javascript/i,
    /<.*>/,
    /\.\./
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(name))) {
    return { isValid: false, error: 'Invalid characters in name' };
  }
  
  return { isValid: true };
};

/**
 * Sanitize input string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Trim whitespace
  let clean = validator.trim(input);
  
  // Remove null bytes
  clean = clean.replace(/\0/g, '');
  
  // Escape HTML
  clean = validator.escape(clean);
  
  // Remove potentially dangerous characters
  clean = clean.replace(/[<>"'&]/g, '');
  
  return clean;
};

/**
 * Validate post input
 */
export const validatePostInput = (data) => {
  const errors = {};
  
  // Title validation
  if (!data.title || validator.isEmpty(data.title.trim())) {
    errors.title = 'Title is required';
  } else if (!validator.isLength(data.title, { min: 5, max: 200 })) {
    errors.title = 'Title must be between 5 and 200 characters';
  } else if (containsSuspiciousPatterns(data.title)) {
    errors.title = 'Title contains invalid characters';
  }
  
  // Content validation
  if (!data.content || validator.isEmpty(data.content.trim())) {
    errors.content = 'Content is required';
  } else if (!validator.isLength(data.content, { min: 10, max: 50000 })) {
    errors.content = 'Content must be between 10 and 50,000 characters';
  }
  
  // Category validation
  const allowedCategories = ['news', 'tech', 'sports', 'entertainment', 'business', 'politics', 'health', 'science'];
  if (data.category && !allowedCategories.includes(data.category)) {
    errors.category = 'Invalid category';
  }
  
  // Image URL validation (if provided)
  if (data.imageUrl && !validator.isURL(data.imageUrl, {
    protocols: ['http', 'https'],
    require_protocol: true,
    allow_underscores: false
  })) {
    errors.imageUrl = 'Invalid image URL';
  }
  
  // Excerpt validation (if provided)
  if (data.excerpt && !validator.isLength(data.excerpt, { max: 500 })) {
    errors.excerpt = 'Excerpt too long (max 500 characters)';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate comment input
 */
export const validateCommentInput = (data) => {
  const errors = {};
  
  if (!data.content || validator.isEmpty(data.content.trim())) {
    errors.content = 'Comment content is required';
  } else if (!validator.isLength(data.content, { min: 3, max: 1000 })) {
    errors.content = 'Comment must be between 3 and 1000 characters';
  } else if (containsSuspiciousPatterns(data.content)) {
    errors.content = 'Comment contains invalid characters';
  }
  
  // Post ID validation
  if (!data.postId || !validator.isInt(data.postId.toString(), { min: 1 })) {
    errors.postId = 'Invalid post ID';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate contact form input
 */
export const validateContactInput = (data) => {
  const errors = {};
  
  // Name validation
  const nameValidation = validateName(data.name);
  if (!nameValidation.isValid) {
    errors.name = nameValidation.error;
  }
  
  // Email validation
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error;
  }
  
  // Message validation
  if (!data.message || validator.isEmpty(data.message.trim())) {
    errors.message = 'Message is required';
  } else if (!validator.isLength(data.message, { min: 10, max: 2000 })) {
    errors.message = 'Message must be between 10 and 2000 characters';
  } else if (containsSuspiciousPatterns(data.message)) {
    errors.message = 'Message contains invalid characters';
  }
  
  // Subject validation (optional)
  if (data.subject && !validator.isLength(data.subject, { max: 100 })) {
    errors.subject = 'Subject too long (max 100 characters)';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate file upload
 */
export const validateFileUpload = (file) => {
  const errors = {};
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!file) {
    errors.file = 'No file provided';
    return { isValid: false, errors };
  }
  
  // Check file size
  if (file.size > maxSize) {
    errors.size = 'File too large (max 5MB)';
  }
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.type = 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed';
  }
  
  // Check file name for suspicious patterns
  if (containsSuspiciousPatterns(file.name)) {
    errors.name = 'Invalid file name';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (page = 1, limit = 10) => {
  const errors = {};
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  if (!validator.isInt(pageNum.toString(), { min: 1 })) {
    errors.page = 'Invalid page number';
  }
  
  if (!validator.isInt(limitNum.toString(), { min: 1, max: 100 })) {
    errors.limit = 'Invalid limit (must be between 1 and 100)';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    page: pageNum || 1,
    limit: Math.min(limitNum || 10, 100)
  };
};

/**
 * Validate search query
 */
export const validateSearchQuery = (query) => {
  const errors = {};
  
  if (!query || validator.isEmpty(query.trim())) {
    errors.query = 'Search query is required';
  } else if (!validator.isLength(query, { min: 2, max: 100 })) {
    errors.query = 'Search query must be between 2 and 100 characters';
  } else if (containsSuspiciousPatterns(query)) {
    errors.query = 'Search query contains invalid characters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Check for suspicious patterns in input
 */
const containsSuspiciousPatterns = (input) => {
  if (typeof input !== 'string') return false;
  
  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /eval\(/gi,
    /expression\(/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /\.\./,
    /union.*select/gi,
    /drop.*table/gi,
    /insert.*into/gi,
    /delete.*from/gi,
    /update.*set/gi
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(input));
};

/**
 * Validate UUID
 */
export const validateUUID = (uuid) => {
  return validator.isUUID(uuid);
};

/**
 * Validate date
 */
export const validateDate = (date) => {
  return validator.isDate(date) || validator.isISO8601(date);
};

/**
 * Validate numeric input
 */
export const validateNumber = (num, options = {}) => {
  const { min, max, integer = false } = options;
  
  if (!validator.isNumeric(num.toString())) {
    return { isValid: false, error: 'Invalid number' };
  }
  
  const parsedNum = integer ? parseInt(num) : parseFloat(num);
  
  if (min !== undefined && parsedNum < min) {
    return { isValid: false, error: `Number must be at least ${min}` };
  }
  
  if (max !== undefined && parsedNum > max) {
    return { isValid: false, error: `Number must be at most ${max}` };
  }
  
  return { isValid: true };
};

const validationExports = {
  validateEmail,
  validatePassword,
  validateName,
  sanitizeInput,
  validatePostInput,
  validateCommentInput,
  validateContactInput,
  validateFileUpload,
  validatePagination,
  validateSearchQuery,
  validateUUID,
  validateDate,
  validateNumber
};

export default validationExports;
