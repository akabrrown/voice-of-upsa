import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { getCMSRateLimit } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { requireAdminOrEditor } from '@/lib/auth-helpers';
import { z } from 'zod';

// Allowed file types and size limits
const ALLOWED_FILE_TYPES = {
  'image/jpeg': { ext: ['.jpg', '.jpeg'], maxSize: 5 * 1024 * 1024 }, // 5MB
  'image/png': { ext: ['.png'], maxSize: 5 * 1024 * 1024 },
  'image/webp': { ext: ['.webp'], maxSize: 5 * 1024 * 1024 },
  'image/gif': { ext: ['.gif'], maxSize: 2 * 1024 * 1024 }, // 2MB
};

const uploadSchema = z.object({
  file: z.any(),
  folder: z.string().regex(/^[a-zA-Z0-9-_]+$/).default('uploads'),
  purpose: z.enum(['article', 'profile', 'admin']).default('article'),
});

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
    // Server-side role check - only admins/editors can upload
    const user = await requireAdminOrEditor(req);

    // Apply strict rate limiting for uploads
    const rateLimit = getCMSRateLimit('POST');
    const rateLimitMiddleware = withRateLimit(rateLimit.requests, rateLimit.window, (req) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    // Validate request
    const validatedData = uploadSchema.parse(req.body);
    const { file, folder, purpose } = validatedData;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'No file provided',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Validate file type
    const fileType = file.type;
    if (!ALLOWED_FILE_TYPES[fileType as keyof typeof ALLOWED_FILE_TYPES]) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: `File type ${fileType} is not allowed`,
          details: `Allowed types: ${Object.keys(ALLOWED_FILE_TYPES).join(', ')}`
        },
        timestamp: new Date().toISOString()
      });
    }

    // Validate file size
    const fileConfig = ALLOWED_FILE_TYPES[fileType as keyof typeof ALLOWED_FILE_TYPES];
    if (file.size > fileConfig.maxSize) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File size exceeds limit of ${fileConfig.maxSize / 1024 / 1024}MB`,
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Generate secure filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const secureFileName = `${timestamp}_${randomString}.${fileExt}`;

    // Create folder path based on purpose
    const folderPath = `${purpose}/${folder}`;
    const filePath = `${folderPath}/${secureFileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('media')
      .upload(filePath, file.buffer, {
        contentType: fileType,
        cacheControl: '31536000', // 1 year cache
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: 'Failed to upload file',
          details: process.env.NODE_ENV === 'development' ? uploadError.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Generate public URL (signed URLs for private files)
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('media')
      .getPublicUrl(filePath);

    // Log successful upload
    console.info(`File uploaded by ${user.email}: ${filePath}`, {
      fileType,
      fileSize: file.size,
      purpose,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      data: {
        url: publicUrl,
        path: filePath,
        fileName: secureFileName,
        fileType,
        fileSize: file.size,
        uploadedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred during upload',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

export default withErrorHandler(handler);
