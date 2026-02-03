import { NextApiRequest, NextApiResponse } from 'next';
import { withPublicCORS } from '@/lib/security/cors-config';
import { getSupabaseAdmin } from '@/lib/database-server';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseAdmin = await getSupabaseAdmin();
    if (!supabaseAdmin) {
      throw new Error('Database connection failed');
    }

    // Try to read settings from database
    const { data: settings, error } = await (supabaseAdmin as any)
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (error) {
      console.warn('Settings not found in database, using defaults:', error.message);
      // Return default settings
      const defaultSettings = {
        site_name: 'Voice of UPSA',
        site_description: 'Official student publication of UPSA',
        site_url: 'https://voiceofupsa.com',
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

    // Return public-safe settings
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
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
}

export default withPublicCORS(handler);
