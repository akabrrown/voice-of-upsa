/**
 * Input Sanitization Utilities
 * Comprehensive sanitization for HTML, text, and other inputs
 */

import DOMPurify from 'isomorphic-dompurify';
import xss from 'xss';

/**
 * Sanitize HTML content with multiple layers of protection
 */
export const sanitizeHtml = (html) => {
  if (typeof html !== 'string') return html;
  
  // First pass with DOMPurify
  const purifyConfig = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'i', 'b',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 
      'a', 'img', 'blockquote', 'code', 'pre',
      'div', 'span'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur']
  };
  
  let clean = DOMPurify.sanitize(html, purifyConfig);
  
  // Second pass with xss for additional protection
  const xssOptions = {
    whiteList: {
      p: [],
      br: [],
      strong: [],
      em: [],
      u: [],
      i: [],
      b: [],
      h1: [], h2: [], h3: [], h4: [], h5: [], h6: [],
      ul: [], ol: [], li: [],
      a: ['href', 'title', 'target'],
      img: ['src', 'alt', 'title'],
      blockquote: [],
      code: [],
      pre: [],
      div: ['class', 'id'],
      span: ['class', 'id']
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'iframe', 'object'],
    escapeHtml: false,
    onTag: function(tag, html) {
      // Additional tag processing if needed
      return html;
    },
    onTagAttr: function(tag, name, value) {
      // Additional attribute processing
      if (tag === 'a' && name === 'href') {
        // Validate href attribute
        if (!value.startsWith('http://') && !value.startsWith('https://') && !value.startsWith('mailto:') && !value.startsWith('tel:')) {
          return false;
        }
      }
      if (tag === 'img' && name === 'src') {
        // Validate src attribute
        if (!value.startsWith('http://') && !value.startsWith('https://') && !value.startsWith('data:image/')) {
          return false;
        }
      }
    }
  };
  
  clean = xss(clean, xssOptions);
  
  return clean;
};

/**
 * Sanitize plain text content
 */
export const sanitizePlainText = (text) => {
  if (typeof text !== 'string') return text;
  
  // Remove all HTML tags
  let clean = text.replace(/<[^>]*>/g, '');
  
  // Remove script content
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove style content
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove javascript: URLs
  clean = clean.replace(/javascript:/gi, '');
  
  // Remove on* event handlers
  clean = clean.replace(/on\w+\s*=\s*['"][^'"]*['"]/gi, '');
  
  // Remove eval() calls
  clean = clean.replace(/eval\s*\([^)]*\)/gi, '');
  
  // Trim and normalize whitespace
  clean = clean.trim().replace(/\s+/g, ' ');
  
  return clean;
};

/**
 * Sanitize URL
 */
export const sanitizeUrl = (url) => {
  if (typeof url !== 'string') return url;
  
  // Remove whitespace
  let clean = url.trim();
  
  // Prevent javascript: URLs
  if (clean.toLowerCase().startsWith('javascript:')) {
    return '#';
  }
  
  // Prevent data: URLs (except for images)
  if (clean.toLowerCase().startsWith('data:') && !clean.toLowerCase().startsWith('data:image/')) {
    return '#';
  }
  
  // Prevent vbscript: URLs
  if (clean.toLowerCase().startsWith('vbscript:')) {
    return '#';
  }
  
  // Validate URL format
  try {
    new URL(clean);
    return clean;
  } catch {
    // If invalid URL, return empty string
    return '';
  }
};

/**
 * Sanitize filename
 */
export const sanitizeFilename = (filename) => {
  if (typeof filename !== 'string') return filename;
  
  // Remove path traversal attempts
  let clean = filename.replace(/\.\./g, '');
  clean = clean.replace(/[\/\\]/g, '');
  
  // Remove dangerous characters
  clean = clean.replace(/[<>:"|?*]/g, '');
  
  // Remove script and executable extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.js', '.vbs', '.php', '.asp', '.jsp'];
  const extension = clean.toLowerCase().substring(clean.lastIndexOf('.'));
  
  if (dangerousExtensions.includes(extension)) {
    clean = clean.substring(0, clean.lastIndexOf('.')) + '.txt';
  }
  
  // Limit filename length
  if (clean.length > 255) {
    const nameWithoutExt = clean.substring(0, clean.lastIndexOf('.'));
    const ext = clean.substring(clean.lastIndexOf('.'));
    clean = nameWithoutExt.substring(0, 255 - ext.length) + ext;
  }
  
  return clean.trim();
};

/**
 * Sanitize email address
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return email;
  
  // Convert to lowercase
  let clean = email.toLowerCase().trim();
  
  // Remove potentially dangerous characters
  clean = clean.replace(/[<>"'&]/g, '');
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clean)) {
    return '';
  }
  
  return clean;
};

/**
 * Sanitize phone number
 */
export const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') return phone;
  
  // Remove all non-digit characters except +, -, (, )
  let clean = phone.replace(/[^\d\+\-\(\)\s]/g, '');
  
  // Trim whitespace
  clean = clean.trim();
  
  return clean;
};

/**
 * Sanitize search query
 */
export const sanitizeSearchQuery = (query) => {
  if (typeof query !== 'string') return query;
  
  // Remove HTML tags
  let clean = query.replace(/<[^>]*>/g, '');
  
  // Remove SQL injection patterns
  clean = clean.replace(/union.*select/gi, '');
  clean = clean.replace(/drop.*table/gi, '');
  clean = clean.replace(/insert.*into/gi, '');
  clean = clean.replace(/delete.*from/gi, '');
  clean = clean.replace(/update.*set/gi, '');
  
  // Remove script content
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Trim and limit length
  clean = clean.trim().substring(0, 200);
  
  return clean;
};

/**
 * Sanitize JSON input
 */
export const sanitizeJson = (jsonString) => {
  if (typeof jsonString !== 'string') return jsonString;
  
  try {
    // Parse and stringify to remove any malicious content
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed);
  } catch {
    // If invalid JSON, return empty object
    return '{}';
  }
};

/**
 * Sanitize array input
 */
export const sanitizeArray = (array) => {
  if (!Array.isArray(array)) return [];
  
  return array.map(item => {
    if (typeof item === 'string') {
      return sanitizePlainText(item);
    } else if (typeof item === 'object' && item !== null) {
      return sanitizeObject(item);
    }
    return item;
  });
};

/**
 * Sanitize object input
 */
export const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Sanitize key
    const cleanKey = key.replace(/[<>:"|?*]/g, '');
    
    // Sanitize value based on type
    if (typeof value === 'string') {
      sanitized[cleanKey] = sanitizePlainText(value);
    } else if (Array.isArray(value)) {
      sanitized[cleanKey] = sanitizeArray(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[cleanKey] = sanitizeObject(value);
    } else {
      sanitized[cleanKey] = value;
    }
  }
  
  return sanitized;
};

/**
 * Remove null bytes from string
 */
export const removeNullBytes = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/\0/g, '');
};

/**
 * Escape special characters for database queries
 */
export const escapeForDb = (str) => {
  if (typeof str !== 'string') return str;
  
  // This is a basic escape - use parameterized queries instead
  return str.replace(/'/g, "''");
};

/**
 * Sanitize markdown content
 */
export const sanitizeMarkdown = (markdown) => {
  if (typeof markdown !== 'string') return markdown;
  
  let clean = markdown;
  
  // Remove HTML tags (markdown should be converted to HTML later)
  clean = clean.replace(/<[^>]*>/g, '');
  
  // Remove script content
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove dangerous link patterns
  clean = clean.replace(/\[.*?\]\(javascript:/gi, '[Link Removed](#)');
  clean = clean.replace(/\[.*?\]\(data:/gi, '[Link Removed](#)');
  
  return clean;
};

/**
 * Comprehensive sanitization function
 */
export const sanitize = (input, type = 'text') => {
  if (input === null || input === undefined) return input;
  
  switch (type) {
    case 'html':
      return sanitizeHtml(input);
    case 'text':
      return sanitizePlainText(input);
    case 'url':
      return sanitizeUrl(input);
    case 'email':
      return sanitizeEmail(input);
    case 'filename':
      return sanitizeFilename(input);
    case 'phone':
      return sanitizePhone(input);
    case 'search':
      return sanitizeSearchQuery(input);
    case 'json':
      return sanitizeJson(input);
    case 'markdown':
      return sanitizeMarkdown(input);
    case 'array':
      return sanitizeArray(input);
    case 'object':
      return sanitizeObject(input);
    default:
      return sanitizePlainText(input);
  }
};

const sanitizeExports = {
  sanitizeHtml,
  sanitizePlainText,
  sanitizeUrl,
  sanitizeFilename,
  sanitizeEmail,
  sanitizePhone,
  sanitizeSearchQuery,
  sanitizeJson,
  sanitizeArray,
  sanitizeObject,
  sanitizeMarkdown,
  sanitize,
  removeNullBytes,
  escapeForDb
};

export default sanitizeExports;
