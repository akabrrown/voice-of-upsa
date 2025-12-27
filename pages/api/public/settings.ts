import { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Try to read settings from file
    try {
      const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
      const settings = JSON.parse(data);
      
      // Return public-safe settings (exclude sensitive data)
      const publicSettings = {
        site_name: settings.site_name,
        site_description: settings.site_description,
        site_url: settings.site_url,
        site_logo: settings.site_logo,
        contact_email: settings.contact_email,
        maintenance_mode: settings.maintenance_mode,
        allow_comments: settings.allow_comments,
        max_upload_size: settings.max_upload_size,
        allowed_image_types: settings.allowed_image_types,
      };
      
      return res.status(200).json({
        success: true,
        data: {
          settings: publicSettings
        }
      });
    } catch {
      // File doesn't exist, return default settings
      const defaultSettings = {
        site_name: 'Voice of UPSA',
        site_description: 'Official student publication of UPSA',
        site_url: 'http://localhost:3000',
        site_logo: '/logo.jpg',
        contact_email: 'voice.of.upsa.mail@gmail.com',
        maintenance_mode: false,
        allow_comments: true,
        max_upload_size: 5242880,
        allowed_image_types: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      };
      
      return res.status(200).json({
        success: true,
        data: {
          settings: defaultSettings
        }
      });
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
}
