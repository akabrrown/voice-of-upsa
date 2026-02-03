import { NextApiRequest, NextApiResponse } from 'next';
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

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'team');
  
  // Ensure upload directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    filter: (part: formidable.Part) => {
      return !!(part.mimetype && part.mimetype.includes('image/'));
    },
    filename: (name: string, ext: string) => {
      return `team-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    }
  });

  try {
    const [, files] = await form.parse(req);
    const file = Array.isArray(files.image) ? files.image[0] : files.image;

    if (!file) {
      return res.status(400).json({ success: false, error: 'No image provided' });
    }

    // Double check mimetype
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!file.mimetype || !allowedTypes.includes(file.mimetype)) {
      if (fs.existsSync(file.filepath)) fs.unlinkSync(file.filepath);
      return res.status(400).json({ success: false, error: 'Invalid file type. Only JPEG, PNG, WebP and GIF are allowed.' });
    }

    const imageUrl = `/uploads/team/${file.newFilename}`;

    return res.status(200).json({
      success: true,
      data: {
        url: imageUrl
      }
    });
  } catch (error: unknown) {
    console.error('Upload error:', error);
    return res.status(500).json({ success: false, error: 'Failed to upload image' });
  }
}

export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'manage:team',
  auditAction: 'team_image_uploaded'
}));
