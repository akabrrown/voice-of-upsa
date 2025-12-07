import { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

const settingsSchema = z.object({
  site_name: z.string().min(1, 'Site name is required'),
  site_description: z.string().min(1, 'Site description is required'),
  site_url: z.string().url('Invalid site URL'),
  site_logo: z.string().min(1, 'Logo URL is required').optional(),
  contact_email: z.string().email('Invalid email address'),
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
  max_upload_size: z.number().int().positive(),
  allowed_image_types: z.array(z.string()),
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await ensureDataDir();

  if (req.method === 'GET') {
    try {
      try {
        const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
        const settings = JSON.parse(data);
        return res.status(200).json(settings);
      } catch (error) {
        const nodeError = error as NodeJS.ErrnoException;
        if (nodeError.code === 'ENOENT') {
          // File doesn't exist, return default settings
          return res.status(200).json(defaultSettings);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error reading settings:', error);
      return res.status(500).json({ error: 'Failed to read settings' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const validationResult = settingsSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationResult.error.errors,
        });
      }

      const settings = validationResult.data;
      
      // Save to file
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
      
      return res.status(200).json({ 
        message: 'Settings saved successfully',
        data: settings 
      });

    } catch (error) {
      console.error('Error saving settings:', error);
      return res.status(500).json({ error: 'Failed to save settings' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
