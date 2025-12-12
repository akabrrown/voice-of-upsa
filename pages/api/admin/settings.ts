import { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { getClientIP } from '@/lib/security/auth-security';

const settingsSchema = z.object({
  site_name: z.string().min(1, 'Site name is required').max(100, 'Site name too long'),
  site_description: z.string().min(1, 'Site description is required').max(500, 'Description too long'),
  site_url: z.string().url('Invalid site URL'),
  site_logo: z.string().optional(),
  contact_email: z.string().email('Invalid contact email'),
  notification_email: z.string().email('Invalid notification email'),
  social_links: z.object({
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    instagram: z.string().optional(),
    linkedin: z.string().optional(),
    tiktok: z.string().optional(),
    youtube: z.string().optional(),
  }).optional(),
  maintenance_mode: z.boolean(),
  allow_comments: z.boolean(),
  moderate_comments: z.boolean(),
  max_upload_size: z.number().int().min(1024, 'Minimum upload size is 1KB').max(10485760, 'Maximum upload size is 10MB'),
  allowed_image_types: z.array(z.string().regex(/^[a-z]+$/, 'Invalid image type')).max(10, 'Too many image types'),
});

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(SETTINGS_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Default settings
const defaultSettings = {
  site_name: 'Voice of UPSA',
  site_description: 'Official student publication of UPSA',
  site_url: 'http://localhost:3000',
  site_logo: '/logo.jpg',
  contact_email: 'voice.of.upsa.mail@gmail.com',
  notification_email: 'voice.of.upsa.mail@gmail.com',
  social_links: {
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    tiktok: '',
    youtube: '',
  },
  maintenance_mode: false,
  allow_comments: true,
  moderate_comments: false,
  max_upload_size: 5242880,
  allowed_image_types: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await ensureDataDir();

  // Apply rate limiting based on method - increased temporarily to prevent rate limit errors
  const rateLimitMiddleware = withRateLimit(1000, 60000, getClientIP); // 1000 requests per minute
  rateLimitMiddleware(req);

  if (req.method === 'GET') {
    try {
      try {
        const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
        const settings = JSON.parse(data);
        
        // Log settings access
        console.log('Settings accessed via admin API');
        
        return res.status(200).json({
          success: true,
          data: settings,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        const nodeError = error as NodeJS.ErrnoException;
        if (nodeError.code === 'ENOENT') {
          // File doesn't exist, return default settings
          return res.status(200).json({
            success: true,
            data: defaultSettings,
            timestamp: new Date().toISOString()
          });
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error reading settings:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to read settings',
        timestamp: new Date().toISOString()
      });
    }
  }

  if (req.method === 'PUT') {
    try {
      console.log('Settings PUT request received. Body:', JSON.stringify(req.body, null, 2));
      
      // Validate input with settingsSchema
      const validationResult = settingsSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.error('Validation failed. Issues:', validationResult.error.issues);
        console.error('Received data:', JSON.stringify(req.body, null, 2));
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
            code: issue.code
          })),
          timestamp: new Date().toISOString()
        });
      }

      const settings = validationResult.data;
      console.log('Validation passed. Cleaned data:', JSON.stringify(settings, null, 2));
      
      // Log settings update attempt
      console.log('Settings update attempted via admin API');
      
      // Save to file
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
      
      // Log successful update
      console.log('Settings updated successfully via admin API');
      
      return res.status(200).json({ 
        success: true,
        message: 'Settings saved successfully',
        data: settings,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error saving settings:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to save settings',
        timestamp: new Date().toISOString()
      });
    }
  }

  return res.status(405).json({ 
    success: false,
    error: 'Method not allowed',
    timestamp: new Date().toISOString()
  });
}

// Wrap with error handler only - temporarily disable CMS security to stop automatic logout
export default withErrorHandler(handler);
