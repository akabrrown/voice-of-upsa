import { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity } from '@/lib/security/cms-security';
import { requireAdminOrEditor } from '@/lib/auth-helpers';
import { signedURLManager } from '@/lib/security/signed-urls';

async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  try {
    // Server-side role check - only admins and editors can generate signed URLs
    await requireAdminOrEditor(req);

    const { mediaType, identifier, options } = req.body;

    if (!mediaType || !identifier) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'mediaType and identifier are required',
          details: 'mediaType: "cloudinary" | "supabase", identifier: publicId or bucket/path'
        },
        timestamp: new Date().toISOString()
      });
    }

    const url = await signedURLManager.getMediaURL(mediaType, identifier, options);

    return res.status(200).json({
      success: true,
      data: {
        url,
        expiresAt: Date.now() + (options?.expiresIn || 3600) * 1000,
        mediaType,
        identifier
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Signed URL generation error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'URL_GENERATION_FAILED',
        message: 'Failed to generate signed URL',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'admin:setup',
  auditAction: 'signed_url_generated'
}));
