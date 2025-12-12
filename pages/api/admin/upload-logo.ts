import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity } from '@/lib/security/cms-security';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req: NextApiRequest, res: NextApiResponse, user: { id: string; email: string; securityLevel?: string }) {
  try {
    // Only allow POST for logo upload
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only POST method is allowed for logo upload',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Log admin logo upload action
    console.log(`Admin logo upload initiated`, {
      adminId: user.id,
      adminEmail: user.email,
      timestamp: new Date().toISOString()
    });

    // Configure formidable with enhanced security
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

    // Enhanced file type validation
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

    // Sanitize filename to prevent path traversal
    const sanitizedFilename = file.originalFilename?.replace(/[^a-zA-Z0-9.-]/g, '') || file.newFilename;
    const logoUrl = `/${sanitizedFilename}`;

    // Update site settings with new logo URL
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .upsert({
        id: 'default',
        site_logo: logoUrl,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .select('id, site_logo, updated_at')
      .single();

    if (error) {
      // Clean up uploaded file
      if (fs.existsSync(file.filepath)) {
        fs.unlinkSync(file.filepath);
      }
      console.error('Admin logo upload database error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'LOGO_UPDATE_FAILED',
          message: 'Failed to update logo',
          details: process.env.NODE_ENV === 'development' ? error.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Log successful logo upload
    console.log(`Admin logo uploaded successfully`, {
      adminId: user.id,
      logoUrl,
      originalFilename: file.originalFilename,
      fileSize: file.size,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      data: { 
        logo_url: logoUrl,
        settings: data,
        uploaded_by: user.id,
        file_info: {
          original_name: file.originalFilename,
          size: file.size,
          type: file.mimetype
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin logo upload API error:', error);
    return res.status(500).json({
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

// Apply CMS security middleware and enhanced error handler
export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'upload:logo',
  auditAction: 'logo_uploaded'
}));
