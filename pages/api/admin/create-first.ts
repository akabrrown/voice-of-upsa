import { NextApiRequest, NextApiResponse } from 'next';
import { checkIfAdminExists, createAdmin, validateAdminSetupToken } from '@/lib/admin';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { z } from 'zod';

// Enhanced validation schema for admin creation
const createAdminSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password too long'),
  token: z.string().min(1, 'Setup token is required')
});

// Flag to permanently disable this route after first admin is created
let routeDisabled = false;

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });
  }

  // Permanently disable route if it was previously used successfully
  if (routeDisabled) {
    return res.status(403).json({ 
      success: false,
      error: {
        code: 'ROUTE_DISABLED',
        message: 'First admin setup route can only be used once',
        details: 'This route is permanently disabled after successful admin creation'
      },
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Validate input with enhanced schema
    const validatedData = createAdminSchema.parse(req.body);
    const { email, password, token } = validatedData;

    // Log admin setup attempt (without sensitive data)
    console.log(`First admin setup attempt initiated`, {
      email,
      timestamp: new Date().toISOString()
    });

    // Validate admin setup token
    if (!validateAdminSetupToken(token)) {
      console.warn(`Invalid admin setup token provided`, {
        email,
        timestamp: new Date().toISOString()
      });
      
      return res.status(401).json({ 
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or missing setup token',
          details: 'The provided token is invalid or expired'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check if admin already exists
    const adminExists = await checkIfAdminExists();
    if (adminExists) {
      console.warn(`Admin setup attempt when admin already exists`, {
        email,
        timestamp: new Date().toISOString()
      });
      
      return res.status(403).json({ 
        success: false,
        error: {
          code: 'ADMIN_EXISTS',
          message: 'An admin user has already been created. This route is now permanently disabled.',
          details: 'Use the regular admin management endpoints instead'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Create the admin user
    const result = await createAdmin({ email, password, name: email.split('@')[0] });
    
    if (!result.success) {
      console.error(`First admin creation failed`, {
        email,
        error: result.error,
        timestamp: new Date().toISOString()
      });
      
      return res.status(500).json({ 
        success: false,
        error: {
          code: 'ADMIN_CREATION_FAILED',
          message: 'Failed to create admin user',
          details: result.error || 'Unknown error occurred'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Permanently disable this route after successful admin creation
    routeDisabled = true;

    // Log successful admin creation
    console.log(`First admin user created successfully`, {
      email,
      timestamp: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      message: 'First admin user created successfully',
      data: {
        user: {
          email,
          role: 'admin',
          created_at: new Date().toISOString()
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('First admin setup API error:', error);
    
    // Handle specific validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Invalid input data',
          details: error.errors.map(err => err.message)
        },
        timestamp: new Date().toISOString()
      });
    }

    // Handle specific Supabase errors
    if (error instanceof Error && error.message?.includes('User already registered')) {
      return res.status(409).json({ 
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'A user with this email already exists in the system',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    if (error instanceof Error && error.message?.includes('duplicate key')) {
      return res.status(409).json({ 
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'A user with this email already exists in the system',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    if (error instanceof Error && error.message?.includes('Password should be')) {
      return res.status(400).json({ 
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Invalid password format',
          details: error.message
        },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(500).json({ 
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while creating the first admin user',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply enhanced error handler
export default withErrorHandler(handler);

// Configure the route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

