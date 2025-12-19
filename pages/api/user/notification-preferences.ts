import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity, getCMSRateLimit } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Enhanced validation schema for notification preferences
const notificationPreferencesSchema = z.object({
  email_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  article_comments: z.boolean().optional(),
  article_likes: z.boolean().optional(),
  new_articles: z.boolean().optional(),
  weekly_digest: z.boolean().optional(),
  marketing_emails: z.boolean().optional(),
  security_alerts: z.boolean().optional()
});

async function handler(req: NextApiRequest, res: NextApiResponse, user: { id: string; email: string; securityLevel?: string }) {
  try {
    // Apply rate limiting based on method
    const rateLimit = getCMSRateLimit(req.method || 'GET');
    const rateLimitMiddleware = withRateLimit(rateLimit.requests, rateLimit.window, (req: NextApiRequest) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    // Log notification preferences access
    console.log(`Notification preferences accessed by user: ${user.email} (${user.id})`, {
      method: req.method,
      timestamp: new Date().toISOString(),
      securityLevel: user.securityLevel
    });

    // Only allow GET and PUT
    if (req.method !== 'GET' && req.method !== 'PUT') {
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only GET and PUT methods are allowed',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }
      if (req.method === 'GET') {
      // Get current notification preferences
      const supabaseAdmin = await getSupabaseAdmin();
      const { data: profile, error: profileError } = await (await supabaseAdmin as any)
        .from('users')
        .select('preferences')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error(`Profile fetch failed for user ${user.email}:`, profileError);
        return res.status(500).json({
          success: false,
          error: {
            code: 'PROFILE_FETCH_FAILED',
            message: 'Failed to fetch notification preferences',
            details: process.env.NODE_ENV === 'development' ? profileError.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Default preferences if none exist
      const defaultPreferences = {
        email_notifications: true,
        push_notifications: false,
        article_comments: true,
        article_likes: true,
        new_articles: false,
        weekly_digest: false,
        marketing_emails: false,
        security_alerts: true
      };

      const preferences = profile?.preferences || defaultPreferences;

      console.log(`Notification preferences returned to user ${user.email}:`, {
        preferencesCount: Object.keys(preferences).length,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        data: { preferences },
        timestamp: new Date().toISOString()
      });

    } else if (req.method === 'PUT') {
      // Validate and update notification preferences
      const validatedData = notificationPreferencesSchema.parse(req.body);
      
      const supabaseAdmin = await getSupabaseAdmin();
      const { data: updatedProfile, error: updateError } = await (await supabaseAdmin as any)
        .from('users')
        .update({ 
          preferences: validatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select('preferences')
        .single();

      if (updateError) {
        console.error(`Preferences update failed for user ${user.email}:`, updateError);
        return res.status(500).json({
          success: false,
          error: {
            code: 'PREFERENCES_UPDATE_FAILED',
            message: 'Failed to update notification preferences',
            details: process.env.NODE_ENV === 'development' ? updateError.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      console.log(`Notification preferences updated for user ${user.email}:`, {
        updatedFields: Object.keys(validatedData),
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        data: { preferences: updatedProfile.preferences },
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error(`Notification preferences API error for user ${user.email}:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while managing notification preferences',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply enhanced CMS security middleware and error handler
export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'manage:notifications',
  auditAction: 'user_notification_preferences_accessed'
}));
                                
