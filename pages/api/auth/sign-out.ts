import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Sign out with Supabase Auth
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({ 
        error: 'Sign out failed',
        details: error.message
      });
    }

    res.status(200).json({
      message: 'Sign out successful'
    });

  } catch (error) {
    console.error('Sign-out error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: 'An unexpected error occurred during sign out'
    });
  }
}

