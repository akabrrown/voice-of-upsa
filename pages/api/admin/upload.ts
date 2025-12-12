import { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity, getCMSRateLimit, CMSUser } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { v2 as cloudinary } from 'cloudinary';
import { z } from 'zod';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Enhanced validation schema
const uploadSchema = z.object({
  file: z.string().min(1, 'File data is required'),
  folder: z.string().min(1, 'Folder name is required').max(50, 'Folder name too long').default('voice-of-upsa')
});

async function handler(req: NextApiRequest, res: NextApiResponse, user: CMSUser) {
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
    // Apply rate limiting for uploads (more restrictive)
    const rateLimit = getCMSRateLimit(req.method || 'GET');
    const rateLimitMiddleware = withRateLimit(Math.min(rateLimit.requests, 10), rateLimit.window, (req: NextApiRequest) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    // Log upload attempt
    console.log(`File upload attempted by admin user: ${user.email} (${user.id})`, {
      timestamp: new Date().toISOString(),
      securityLevel: user.securityLevel
    });

    // Validate input
    const validationResult = uploadSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Invalid input data',
          details: validationResult.error.errors.map(err => err.message)
        },
        timestamp: new Date().toISOString()
      });
    }

    const { file, folder } = validationResult.data;

    // Additional security checks
    if (!file || !file.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE',
          message: 'Only image files are allowed',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check file size from base64 (rough estimate)
    const base64Data = file.split(',')[1];
    if (base64Data && base64Data.length * 0.75 > 5000000) { // 5MB limit
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'File size exceeds 5MB limit',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Sanitize folder name to prevent directory traversal
    const sanitizedFolder = folder.replace(/[^a-zA-Z0-9-_]/g, '');

    // Upload to Cloudinary with security constraints
    const result = await cloudinary.uploader.upload(file, {
      folder: sanitizedFolder,
      resource_type: 'auto',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      max_file_size: 5000000, // 5MB
      secure: true, // Force HTTPS URLs
      quality: 'auto:good', // Optimize quality
      fetch_format: 'auto', // Auto-convert to optimal format
    });

    // Log successful upload
    console.log(`File uploaded successfully by admin: ${user.email}`, {
      publicId: result.public_id,
      format: result.format,
      size: result.bytes,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
        uploadedBy: user.email
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`File upload error for admin ${user.email}:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_FAILED',
        message: 'Failed to upload file',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply enhanced CMS security middleware and error handler
export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'upload:media',
  auditAction: 'file_uploaded'
}));

