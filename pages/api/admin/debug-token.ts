import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    console.log('Debug Token: Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No Bearer token found',
        authHeader: authHeader || 'none'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Debug Token: Token length:', token.length);
    console.log('Debug Token: Token preview:', token.substring(0, 50) + '...');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    console.log('Debug Token: Testing token validation...');
    const authResult = await supabase.auth.getUser(token);
    
    console.log('Debug Token: Auth result:', {
      user: !!authResult.data.user,
      error: !!authResult.error,
      errorMessage: authResult.error?.message,
      errorCode: authResult.error?.code
    });

    if (authResult.error) {
      return res.status(401).json({
        error: 'Token validation failed',
        details: authResult.error.message,
        code: authResult.error.code
      });
    }

    if (!authResult.data.user) {
      return res.status(401).json({
        error: 'No user found for token'
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: authResult.data.user.id,
        email: authResult.data.user.email,
        role: authResult.data.user.user_metadata?.role || 'user'
      }
    });

  } catch (error) {
    console.error('Debug Token: Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: (error as Error).message
    });
  }
}
