import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Simple JWT-based auth without rate limiting issues
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin: SupabaseClient | null = null;

if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

export interface SimpleUser {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'editor';
  name?: string;
}

export function generateToken(user: SimpleUser): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): SimpleUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id?: string;
      email: string;
      role?: string;
      name?: string;
    };
    return {
      id: decoded.id || '',
      email: decoded.email,
      role: (decoded.role as 'user' | 'admin' | 'editor') || 'user',
      name: decoded.name
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export function createSessionCookie(token: string): string {
  return `auth-token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`;
}

// Overloaded function to handle both NextApiRequest and NextRequest
export function getTokenFromRequest(req: {
  headers?: {
    get?: (name: string) => string | null;
    authorization?: string;
    cookie?: string;
  };
}): string | null {
  // Try to get token from Authorization header first
  const authHeader = req.headers?.get?.('authorization') || req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Try to get token from cookies
  const cookies = req.headers?.get?.('cookie') || req.headers?.cookie || '';
  const tokenMatch = cookies.match(/auth-token=([^;]+)/);
  if (tokenMatch) {
    return tokenMatch[1] || null;
  }
  
  return null;
}

// Function to find user by email from database
export async function findUserByEmail(email: string): Promise<SimpleUser | null> {
  if (!supabaseAdmin) {
    console.warn('Supabase admin client not available');
    return null;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      role: data.role || 'user',
      name: data.name
    };
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
}

// Function to find user by ID from database
export async function findUserById(id: string): Promise<SimpleUser | null> {
  if (!supabaseAdmin) {
    console.warn('Supabase admin client not available');
    return null;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      role: data.role || 'user',
      name: data.name
    };
  } catch (error) {
    console.error('Error finding user by ID:', error);
    return null;
  }
}
