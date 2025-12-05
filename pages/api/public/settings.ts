import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch public site settings
    const { data: settings, error } = await supabaseAdmin
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // If no settings found, return default values
    const defaultSettings = {
      site_name: 'Voice of UPSA',
      site_description: 'Empowering the University of Professional Studies community through quality journalism',
      site_url: 'https://voiceofupsa.com',
      contact_email: 'voice@upsa.edu.gh',
      notification_email: 'notifications@upsa.edu.gh',
      social_links: {
        facebook: 'https://facebook.com/voiceofupsa',
        twitter: 'https://twitter.com/voiceofupsa',
        instagram: 'https://instagram.com/voiceofupsa',
        youtube: 'https://youtube.com/@voiceofupsa',
        tiktok: 'https://tiktok.com/@voice_of_upsa',
        linkedin: 'https://linkedin.com/company/voiceofupsa',
      },
      maintenance_mode: false,
      allow_comments: true,
      moderate_comments: true,
      max_upload_size: 5242880,
      allowed_image_types: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    };

    const finalSettings = settings || defaultSettings;

    res.status(200).json({
      success: true,
      data: {
        settings: finalSettings
      }
    });

  } catch (error) {
    console.error('Error fetching public settings:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch settings' 
    });
  }
}
