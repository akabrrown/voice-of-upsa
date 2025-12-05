import { NextApiRequest, NextApiResponse } from 'next';
import { checkIfAdminExists, createAdmin, validateAdminSetupToken } from '@/lib/admin';

// Flag to permanently disable this route after first admin is created
let routeDisabled = false;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Permanently disable route if it was previously used successfully
  if (routeDisabled) {
    return res.status(403).json({ 
      error: 'Route permanently disabled',
      message: 'First admin setup route can only be used once'
    });
  }

  try {
    const { email, password, token } = req.body;

    // Validate required fields
    if (!email || !password || !token) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'email, password, and token are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format',
        message: 'Please provide a valid email address'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ 
        error: 'Password too short',
        message: 'Password must be at least 8 characters long'
      });
    }

    // Validate admin setup token
    if (!validateAdminSetupToken(token)) {
      return res.status(401).json({ 
        error: 'Invalid or missing setup token',
        message: 'The provided token is invalid or expired'
      });
    }

    // Check if admin already exists
    const adminExists = await checkIfAdminExists();
    if (adminExists) {
      return res.status(403).json({ 
        error: 'Admin already exists',
        message: 'An admin user has already been created. This route is now permanently disabled.'
      });
    }

    // Create the admin user
    const result = await createAdmin({ email, password, name: email.split('@')[0] });
    
    if (!result.success) {
      return res.status(500).json({ 
        error: 'Failed to create admin',
        message: result.error || 'Unknown error occurred'
      });
    }

    // Permanently disable this route after successful admin creation
    routeDisabled = true;

    return res.status(201).json({
      success: true,
      message: 'First admin user created successfully',
      user: {
        email,
        role: 'admin',
        created_at: new Date().toISOString()
      }
    });

  } catch (error) {
    // Handle specific Supabase errors
    if (error instanceof Error && error.message?.includes('User already registered')) {
      return res.status(409).json({ 
        error: 'User already exists',
        message: 'A user with this email already exists in the system'
      });
    }

    if (error instanceof Error && error.message?.includes('duplicate key')) {
      return res.status(409).json({ 
        error: 'User already exists',
        message: 'A user with this email already exists in the system'
      });
    }

    if (error instanceof Error && error.message?.includes('Password should be')) {
      return res.status(400).json({ 
        error: 'Invalid password',
        message: error.message
      });
    }

    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to create admin user'
    });
  }
}

// Configure the route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

