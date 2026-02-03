import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity } from '@/lib/security/cms-security';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { getClientIP } from '@/lib/security/auth-security';
import { getSupabaseAdmin } from '@/lib/database-server';

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

// Default settings
const defaultSettings = {
  site_name: 'Voice of UPSA',
  site_description: 'Official student publication of UPSA',
  site_url: 'https://voiceofupsa.com',
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
  // Apply rate limiting based on method
  const rateLimitMiddleware = withRateLimit(1000, 60000, getClientIP);
  rateLimitMiddleware(req);

  const supabaseAdmin = await getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Database connection failed');
  }

  if (req.method === 'GET') {
    try {
      console.log('Fetching settings from database...');
      const { data: settings, error } = await (supabaseAdmin as any)
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') { // Row not found
          return res.status(200).json({
            success: true,
            data: defaultSettings,
            timestamp: new Date().toISOString()
          });
        }
        throw error;
      }
      
      return res.status(200).json({
        success: true,
        data: settings,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error reading settings from database:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to read settings',
        timestamp: new Date().toISOString()
      });
    }
  }

  if (req.method === 'PUT') {
    try {
      console.log('Updating settings in database. Body:', JSON.stringify(req.body, null, 2));
      
      const validationResult = settingsSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues,
          timestamp: new Date().toISOString()
        });
      }

      const settings = validationResult.data;
      
      const { data: updatedSettings, error: dbError } = await (supabaseAdmin as any)
        .from('settings')
        .upsert({ 
          id: 1,
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (dbError) {
        console.error('Database update error:', dbError);
        throw new Error('Failed to update settings in database');
      }
      
      return res.status(200).json({ 
        success: true,
        message: 'Settings saved successfully',
        data: updatedSettings,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error saving settings to database:', error);
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

export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'manage:settings',
  auditAction: 'admin_settings_updated'
}));
