import { NextApiRequest } from 'next';

/**
 * Sanitize input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize and validate URL
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  // Remove dangerous protocols
  url = url.replace(/javascript:/gi, '');
  url = url.replace(/data:/gi, '');
  url = url.replace(/vbscript:/gi, '');
  
  // Ensure URL starts with http/https
  if (url && !url.match(/^https?:\/\//)) {
    url = 'https://' + url;
  }
  
  return url;
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: File, maxSize: number = 5 * 1024 * 1024, allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']): {
  isValid: boolean;
  error: string | null;
} {
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
    };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed`
    };
  }
  
  return {
    isValid: true,
    error: null
  };
}

// Simple schema validation types
type SchemaType = 'string' | 'number' | 'boolean' | 'enum' | 'array' | 'object';

interface SchemaField {
  type: SchemaType;
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  enum?: (string | number)[];
  default?: unknown;
  items?: SchemaField; // For arrays
  properties?: Record<string, SchemaField>; // For objects
}

type ValidationSchema = Record<string, SchemaField>;

export const commonSchemas = {
  articleCreate: {
    title: { type: 'string', required: true, minLength: 1, maxLength: 255 },
    content: { type: 'string', required: true, minLength: 1 },
    excerpt: { type: 'string', maxLength: 500 },
    featured_image: { type: 'string' },
    status: { type: 'enum', enum: ['draft', 'published', 'archived'], default: 'draft' },
    category_id: { type: 'string' },
    meta_title: { type: 'string', maxLength: 60 },
    meta_description: { type: 'string', maxLength: 160 },
    meta_keywords: { type: 'string' }
  } as ValidationSchema
};

export function validateRequest(schema: ValidationSchema, source: 'body' | 'query' = 'body') {
  return (req: NextApiRequest) => {
    const data = (source === 'body' ? req.body : req.query) as Record<string, unknown>;
    const validatedData: Record<string, unknown> = {};
    const errors: string[] = [];

    for (const [key, field] of Object.entries(schema)) {
      let value = data[key];

      // Apply default if missing
      if (value === undefined && field.default !== undefined) {
        value = field.default;
      }

      // Check required
      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push(`${key} is required`);
        continue;
      }

      if (value !== undefined && value !== null) {
        // Type conversion for query params (they are always strings)
        if (source === 'query') {
          if (field.type === 'number') {
            const num = Number(value);
            if (!isNaN(num)) value = num;
          } else if (field.type === 'boolean') {
            value = value === 'true';
          }
        }

        // Type check
        if (field.type === 'number' && typeof value !== 'number') {
          errors.push(`${key} must be a number`);
        } else if (field.type === 'string' && typeof value !== 'string') {
          errors.push(`${key} must be a string`);
        } else if (field.type === 'boolean' && typeof value !== 'boolean') {
          errors.push(`${key} must be a boolean`);
        } else if (field.type === 'array' && !Array.isArray(value)) {
          errors.push(`${key} must be an array`);
        }

        // Constraints
        if (typeof value === 'string') {
          if (field.minLength && value.length < field.minLength) {
            errors.push(`${key} must be at least ${field.minLength} characters`);
          }
          if (field.maxLength && value.length > field.maxLength) {
            errors.push(`${key} must be at most ${field.maxLength} characters`);
          }
          if (field.pattern && !field.pattern.test(value)) {
            errors.push(`${key} format is invalid`);
          }
        }

        if (typeof value === 'number') {
          if (field.min !== undefined && value < field.min) {
            errors.push(`${key} must be at least ${field.min}`);
          }
          if (field.max !== undefined && value > field.max) {
            errors.push(`${key} must be at most ${field.max}`);
          }
        }

        if (field.enum && !field.enum.includes(value as string | number)) {
          errors.push(`${key} must be one of: ${field.enum.join(', ')}`);
        }
      }

      validatedData[key] = value;
    }

    if (errors.length > 0) {
      const error = new Error(errors.join(', ')) as Error & { statusCode?: number; code?: string; details?: string[] };
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      error.details = errors;
      throw error;
    }

    return validatedData;
  };
}
