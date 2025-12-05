import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('=== Media Upload API Called ===');
  console.log('Method:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting file upload process...');
    
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
    });

    console.log('Parsing form data...');
    const [, files] = await form.parse(req);
    console.log('Files parsed:', files);
    
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    console.log('File object:', file);
    
    if (!file) {
      console.error('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.mimetype || '')) {
      console.error('File type not allowed:', file.mimetype);
      return res.status(400).json({ error: 'File type not allowed' });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(file.originalFilename || '');
    const filename = `${timestamp}_${randomString}${extension}`;
    
    // Create file path
    const filePath = path.join(uploadsDir, filename);
    
    // Copy file to uploads directory
    try {
      fs.copyFileSync(file.filepath, filePath);
      console.log('File copied successfully to:', filePath);
    } catch (copyErr) {
      console.error('Error copying file:', copyErr);
      return res.status(500).json({ error: 'Failed to save uploaded file.' });
    }

    // Clean up temporary file
    fs.unlinkSync(file.filepath);

    // Return file info
    const publicUrl = `/uploads/${filename}`;
    
    res.status(200).json({
      id: filename,
      url: publicUrl,
      filename: file.originalFilename,
      size: file.size,
      type: file.mimetype,
      public_id: filename,
      format: extension.replace('.', ''),
    });

  } catch (error) {
    console.error('Upload error details:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Upload failed';
    
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        errorMessage = 'File not found or could not be read';
      } else if (error.message.includes('EACCES')) {
        errorMessage = 'File permission denied';
      } else {
        errorMessage = `Upload failed: ${error.message}`;
      }
    }
    
    // Include stack trace for debugging (optional)
    const responsePayload: Record<string, unknown> = {
      error: errorMessage,
      details: error instanceof Error ? error.message : 'Unknown error',
    };
    if (error instanceof Error && error.stack) {
      responsePayload.stack = error.stack;
    }

    res.status(500).json(responsePayload);
  }
}
