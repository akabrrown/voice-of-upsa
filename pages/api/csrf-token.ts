import { NextApiRequest, NextApiResponse } from 'next';
import { CSRFProtection } from '@/lib/csrf';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests for CSRF token
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET requests are allowed'
      }
    });
  }

  try {
    // Generate and set CSRF token
    const token = CSRFProtection.createSignedToken();
    CSRFProtection.setCSRFCookie(res, token);

    return res.status(200).json({
      success: true,
      data: {
        csrfToken: token
      },
      message: 'CSRF token generated successfully'
    });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'TOKEN_GENERATION_FAILED',
        message: 'Failed to generate CSRF token'
      }
    });
  }
}
