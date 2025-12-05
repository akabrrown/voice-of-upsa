import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { authenticate, checkRole } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/auth';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// Rate limiting: 5 uploads per minute per admin
const rateLimitMiddleware = withRateLimit(5, 60 * 1000, (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  return token || req.socket.remoteAddress || 'unknown';
});

// Validation schema for potential future use
// const logoUpdateSchema = z.object({
//   site_logo: z.string().url('Invalid logo URL')
// });

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Apply rate limiting
    rateLimitMiddleware(req);

    // Authenticate user
    const user = await authenticate(req);

    // Authorize admin access
    if (!checkRole(user.role, ['admin'])) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // POST - Upload logo
    if (req.method === 'POST') {
      const form = formidable({
        uploadDir: path.join(process.cwd(), 'public'),
        keepExtensions: true,
        maxFileSize: 2 * 1024 * 1024, // 2MB
        filter: function (part: formidable.Part) {
          return Boolean(part.mimetype && part.mimetype.includes('image/'));
        },
        filename: function (name: string, ext: string) {
          return `logo-${Date.now()}${ext}`;
        }
      });

      const [, files] = await form.parse(req);

      const file = Array.isArray(files.logo) ? files.logo[0] : files.logo;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'No logo file provided',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype || '')) {
        // Clean up uploaded file
        if (fs.existsSync(file.filepath)) {
          fs.unlinkSync(file.filepath);
        }
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'Invalid file type. Only JPG, PNG, GIF, and WebP are allowed',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Get the relative path for the database
      const logoUrl = `/${file.originalFilename || file.newFilename}`;

      // Update site settings with new logo URL
      const { data, error } = await supabaseAdmin
        .from('site_settings')
        .upsert({
          id: 'default',
          site_logo: logoUrl,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        // Clean up uploaded file
        if (fs.existsSync(file.filepath)) {
          fs.unlinkSync(file.filepath);
        }
        console.error('Error updating logo:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'LOGO_UPDATE_FAILED',
            message: 'Failed to update logo',
            details: error.message
          },
          timestamp: new Date().toISOString()
        });
      }

      // Log logo update
      console.info(`Site logo updated by admin: ${user.id}`, {
        logo_url: logoUrl,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        data: { 
          logo_url: logoUrl,
          settings: data
        },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Logo upload API error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while processing logo upload',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Wrap with error handler middleware
export default withErrorHandler(handler);
