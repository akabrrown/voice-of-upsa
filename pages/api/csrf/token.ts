import { NextApiRequest, NextApiResponse } from 'next';
import { CSRFProtection } from '../../../lib/csrf';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Generate and set CSRF token
    const token = CSRFProtection.createSignedToken();
    CSRFProtection.setCSRFCookie(res, token);

    return res.status(200).json({ 
      success: true,
      token: token // Also return token for direct use if needed
    });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate CSRF token'
    });
  }
}
