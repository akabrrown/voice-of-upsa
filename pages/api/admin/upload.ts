import { NextApiRequest, NextApiResponse } from 'next';
import { verifySupabaseToken, requireRole } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userId = await verifySupabaseToken(req.headers.authorization?.replace('Bearer ', '') || '');

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin or editor
    await requireRole(req, ['admin', 'editor']);

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { file, folder = 'voice-of-upsa' } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: 'auto',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      max_file_size: 5000000, // 5MB
    });

    return res.status(200).json({
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return res.status(500).json({ error: 'Failed to upload image' });
  }
}

