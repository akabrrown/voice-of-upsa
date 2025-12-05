import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { authenticate, checkRole } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Validation schemas
const settingsUpdateSchema = z.object({
  site_name: z.string().min(1, 'Site name is required').max(100, 'Site name must not exceed 100 characters'),
  site_description: z.string().min(1, 'Site description is required').max(500, 'Site description must not exceed 500 characters'),
  site_url: z.string().url('Invalid site URL'),
  contact_email: z.string().email('Invalid contact email'),
  notification_email: z.string().email('Invalid notification email'),
  site_logo: z.string().url('Invalid logo URL').optional().default('/logo.jpg'),
  social_links: z.object({
    facebook: z.string().url('Invalid Facebook URL').optional(),
    twitter: z.string().url('Invalid Twitter URL').optional(),
    instagram: z.string().url('Invalid Instagram URL').optional(),
    linkedin: z.string().url('Invalid LinkedIn URL').optional(),
    tiktok: z.string().url('Invalid TikTok URL').optional(),
  }).optional(),
  maintenance_mode: z.boolean(),
  allow_comments: z.boolean(),
  moderate_comments: z.boolean(),
  max_upload_size: z.number().min(1024, 'Max upload size must be at least 1KB').max(10485760, 'Max upload size must not exceed 10MB'),
  allowed_image_types: z.array(z.enum(['jpg', 'jpeg', 'png', 'gif', 'webp'])).min(1, 'At least one image type must be allowed')
});

// Rate limiting: 10 requests per minute per admin (settings are sensitive)
const rateLimitMiddleware = withRateLimit(10, 60 * 1000, (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  return token || req.socket.remoteAddress || 'unknown';
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('=== Admin Settings API Called ===');
    console.log('Method:', req.method);
    console.log('Headers:', req.headers.authorization ? 'Auth present' : 'No auth');
    
    // Apply rate limiting
    rateLimitMiddleware(req);

    // Authenticate user
    console.log('Authenticating user...');
    const user = await authenticate(req);
    console.log('User authenticated:', user.id, 'Role:', user.role);

    // Authorize admin access
    if (!checkRole(user.role, ['admin'])) {
      console.log('Access denied - not admin');
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // GET - Fetch settings
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('site_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (error) {
        console.error('Error fetching settings:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'SETTINGS_FETCH_FAILED',
            message: 'Failed to fetch settings',
            details: error.message
          },
          timestamp: new Date().toISOString()
        });
      }

      // Return default settings if none exist
      if (!data) {
        const defaultSettings = {
          id: 'default',
          site_name: 'Voice of UPSA',
          site_description: 'Empowering the University of Professional Studies community through quality journalism',
          site_url: 'https://voiceofupsa.com',
          contact_email: 'voice.of.upsa.mail@gmail.com',
          notification_email: 'voice.of.upsa.mail@gmail.com',
          site_logo: '/logo.jpg',
          social_links: {
            facebook: 'https://facebook.com/voiceofupsa',
            twitter: 'https://twitter.com/voiceofupsa',
            instagram: 'https://instagram.com/voiceofupsa',
            linkedin: 'https://linkedin.com/company/voiceofupsa',
            tiktok: 'https://tiktok.com/@voiceofupsa',
          },
          maintenance_mode: false,
          allow_comments: true,
          moderate_comments: true,
          max_upload_size: 5242880, // 5MB
          allowed_image_types: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        return res.status(200).json({
          success: true,
          data: { settings: defaultSettings },
          timestamp: new Date().toISOString()
        });
      }

      // Log settings access
      console.info(`Admin settings accessed by: ${user.id}`, {
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        data: { settings: data },
        timestamp: new Date().toISOString()
      });
    }

    // PUT - Update settings
    if (req.method === 'PUT') {
      // Validate input
      const validatedData = settingsUpdateSchema.parse(req.body);
      const settings = { ...validatedData, updated_at: new Date().toISOString() };

      // Upsert settings (update if exists, insert if not)
      const { data, error } = await supabaseAdmin
        .from('site_settings')
        .upsert({
          id: 'default',
          ...settings,
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating settings:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'SETTINGS_UPDATE_FAILED',
            message: 'Failed to update settings',
            details: error.message
          },
          timestamp: new Date().toISOString()
        });
      }

      // Log critical settings update
      console.info(`Site settings updated by admin: ${user.id}`, {
        changes: {
          site_name: settings.site_name,
          site_url: settings.site_url,
          contact_email: settings.contact_email,
          maintenance_mode: settings.maintenance_mode
        },
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        data: { settings: data },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET and PUT methods are allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin settings API error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'An unexpected error occurred while processing settings request';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let details = process.env.NODE_ENV === 'development' ? (error as Error).message : null;
    
    if (error instanceof Error) {
      if (error.message.includes('relation') && error.message.includes('site_settings')) {
        errorMessage = 'Site settings table does not exist - please run the database migration';
        errorCode = 'TABLE_NOT_FOUND';
      } else if (error.message.includes('permission denied')) {
        errorMessage = 'Database permission denied - check user permissions';
        errorCode = 'PERMISSION_DENIED';
      } else if (error.message.includes('validation')) {
        errorMessage = 'Invalid settings data provided';
        errorCode = 'VALIDATION_ERROR';
        details = error.message;
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Too many requests - please try again later';
        errorCode = 'RATE_LIMIT_EXCEEDED';
      } else {
        errorMessage = `Settings API error: ${error.message}`;
        details = error.message;
      }
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        details: details
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Wrap with error handler middleware
export default withErrorHandler(handler);

