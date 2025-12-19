import { NextApiRequest, NextApiResponse } from 'next';
import { getCurrentSession } from '@/lib/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('=== Debug Auth API ===');
    console.log('Checking current session...');
    
    const session = await getCurrentSession();
    
    console.log('Session result:', {
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userId: session?.user?.id,
      sessionExpiresAt: session?.expires_at
    });

    return res.status(200).json({
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      hasUser: !!session?.user,
      userEmail: session?.user?.email || null,
      userId: session?.user?.id || null,
      sessionExpiresAt: session?.expires_at || null,
      fullSession: session
    });
  } catch (error) {
    console.error('Debug auth error:', error);
    return res.status(500).json({
      error: 'Failed to check authentication',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
