import { NextApiRequest, NextApiResponse } from 'next';
import { uploadImage, deleteImage, validateCloudinaryConfig } from '@/lib/cloudinary';
import { supabaseAdmin } from '@/lib/database-server';
import { CSRFProtection } from '@/lib/csrf';
import { rateLimits } from '@/lib/rate-limiter';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check Cloudinary configuration
  if (!validateCloudinaryConfig()) {
    return res.status(500).json({
      error: 'Cloudinary not configured',
      message: 'Please check your environment variables'
    });
  }

  try {
    // Apply rate limiting
    rateLimits.upload(req, res);
    
    switch (req.method) {
      case 'POST':
        // Apply CSRF protection for POST requests
        if (!CSRFProtection.protect(req)) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'CSRF_INVALID',
              message: 'Invalid CSRF token',
              details: 'Please refresh the page and try again'
            },
            timestamp: new Date().toISOString()
          });
        }
        return handleUpload(req, res);
      case 'DELETE':
        // Apply CSRF protection for DELETE requests
        if (!CSRFProtection.protect(req)) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'CSRF_INVALID',
              message: 'Invalid CSRF token',
              details: 'Please refresh the page and try again'
            },
            timestamp: new Date().toISOString()
          });
        }
        return handleDelete(req, res);
      default:
        res.setHeader('Allow', ['POST', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Upload API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleUpload(req: NextApiRequest, res: NextApiResponse) {
  // Require authentication for all uploads
  if (!req.headers.authorization) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'You must be authenticated to upload files'
    });
  }

  const token = req.headers.authorization.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({
      error: 'Invalid authentication',
      message: 'Your authentication token is invalid or expired'
    });
  }

  const { file, folder, type = 'article' } = req.body;

  // Validate input
  if (!file) {
    return res.status(400).json({
      error: 'Missing file data',
      message: 'File data is required'
    });
  }

  // Strict file validation
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  // Validate base64 format and extract MIME type
  const matches = file.match(/^data:(image\/\w+);base64,(.+)$/);
  
  if (!matches) {
    return res.status(400).json({
      error: 'Invalid file format',
      message: 'File must be a valid base64 encoded image'
    });
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  // Validate file type
  if (!allowedTypes.includes(mimeType)) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: 'Only JPEG, PNG, WebP, and GIF images are allowed'
    });
  }

  // Validate file size
  try {
    const size = Buffer.byteLength(base64Data, 'base64');
    if (size > maxSize) {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size must be less than 5MB'
      });
    }
    
    // Log file size for debugging
    console.log(`Uploading image: ${Math.round(size / 1024)}KB, type: ${mimeType}`);
  } catch {
    return res.status(400).json({
      error: 'Invalid file data',
      message: 'File data is corrupted or invalid'
    });
  }

  try {
    // Add timeout to prevent hanging uploads
    const uploadPromise = uploadImage(file, `voice-of-upsa/${folder || type}`);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Upload timeout')), 45000) // 45 second timeout
    );
    
    const result = await Promise.race([uploadPromise, timeoutPromise]) as {
      public_id: string;
      secure_url: string;
      width: number;
      height: number;
    };

    // Log upload for analytics using authenticated user
    console.log(`User ${user.id} uploaded image: ${result.public_id} (${Math.round(Buffer.byteLength(base64Data, 'base64') / 1024)}KB)`);

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { publicId } = req.body;

  // Validate input
  if (!publicId) {
    return res.status(400).json({
      error: 'Missing public ID',
      message: 'Public ID is required for deletion'
    });
  }

  try {
    // Delete from Cloudinary
    const result = await deleteImage(publicId);

    // Log deletion for analytics
    // Log deletion for analytics
    if (req.headers.authorization) {
      const token = req.headers.authorization.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

      if (!authError && user) {
        console.log(`User ${user.id} deleted image: ${publicId}`);
      }
    }

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({
      error: 'Delete failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

