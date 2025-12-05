import { NextApiRequest, NextApiResponse } from 'next';
import { uploadImage, deleteImage, validateCloudinaryConfig } from '@/lib/cloudinary';
import { supabaseAdmin } from '@/lib/database-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check Cloudinary configuration
  if (!validateCloudinaryConfig()) {
    return res.status(500).json({
      error: 'Cloudinary not configured',
      message: 'Please check your environment variables'
    });
  }

  try {
    switch (req.method) {
      case 'POST':
        return handleUpload(req, res);
      case 'DELETE':
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
  const { file, folder, type = 'article' } = req.body;

  // Validate input
  if (!file) {
    return res.status(400).json({
      error: 'Missing file data',
      message: 'File data is required'
    });
  }

  // Validate file format (base64)
  if (typeof file !== 'string' || !file.startsWith('data:image/')) {
    return res.status(400).json({
      error: 'Invalid file format',
      message: 'File must be a base64 encoded image'
    });
  }

  try {
    // Upload to Cloudinary
    const result = await uploadImage(file, `voice-of-upsa/${folder || type}`);

    // Log upload for analytics
    // Log upload for analytics
    if (req.headers.authorization) {
      const token = req.headers.authorization.replace('Bearer ', '');
      // Use admin client for verification to bypass RLS/connection issues
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

      if (!authError && user) {
        // Log the upload activity (you can create an uploads table if needed)
        console.log(`User ${user.id} uploaded image: ${result.public_id}`);
      } else {
        console.warn('Upload logged but auth verification failed:', authError?.message);
      }
    }

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

