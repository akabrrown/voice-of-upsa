import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { authenticate } from '@/lib/api/middleware/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET and PUT methods
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

  // Authenticate user
  const user = await authenticate(req);

  // Check if user is editor or admin
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Unable to verify user role',
        details: null
      },
      timestamp: new Date().toISOString()
    });
  }

  // Only editors and admins can access notification preferences
  if (userData.role !== 'editor' && userData.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Notification preferences are only available for editors and administrators',
        details: null
      },
      timestamp: new Date().toISOString()
    });
  }

  if (req.method === 'GET') {
    return await handleGet(req, res, user.id);
  } else if (req.method === 'PUT') {
    return await handlePut(req, res, user.id);
  }
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    // Get user's notification preferences
    const { data: preferences, error } = await supabaseAdmin
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no preferences exist, create default ones
      if (error.code === 'PGRST116') {
        const { data: newPreferences, error: createError } = await supabaseAdmin
          .from('notification_preferences')
          .insert({
            user_id: userId,
            email_notifications: true,
            push_notifications: true,
            article_comments: true,
            new_followers: true,
            weekly_digest: false,
            security_alerts: true
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        return res.status(200).json({
          success: true,
          data: { preferences: newPreferences },
          timestamp: new Date().toISOString()
        });
      }

      throw error;
    }

    return res.status(200).json({
      success: true,
      data: { preferences },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    throw error;
  }
}

async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const {
      email_notifications,
      push_notifications,
      article_comments,
      new_followers,
      weekly_digest,
      security_alerts
    } = req.body;

    // Validate input - all fields should be boolean
    const validations = {
      email_notifications,
      push_notifications,
      article_comments,
      new_followers,
      weekly_digest,
      security_alerts
    };

    for (const [key, value] of Object.entries(validations)) {
      if (typeof value !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `${key} must be a boolean value`,
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    // Update preferences (upsert)
    const { data: preferences, error } = await supabaseAdmin
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        email_notifications,
        push_notifications,
        article_comments,
        new_followers,
        weekly_digest,
        security_alerts,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: { preferences },
      message: 'Notification preferences updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
}

export default withErrorHandler(handler);
