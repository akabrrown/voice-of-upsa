import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/database';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { z } from 'zod';

// Validation schema
const subscribeSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').max(255).optional()
});

// Input sanitization middleware
const sanitizeMiddleware = (req: NextApiRequest) => {
  const fields = ['email', 'name'];
  fields.forEach(field => {
    if (req.body[field]) {
      req.body[field] = req.body[field]
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript protocol
        .replace(/on\w+=/gi, ''); // Remove event handlers
    }
  });
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Validate and sanitize input
    subscribeSchema.parse(req.body);
    sanitizeMiddleware(req);
    const { email, name } = req.body;

    // Check if email already exists
    const { data: existing, error: checkError } = await supabase
      .from('newsletter_subscriptions')
      .select('id, status, name')
      .eq('email', email)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing subscription:', checkError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to check subscription status',
          details: process.env.NODE_ENV === 'development' ? checkError.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // If already subscribed and active
    if (existing && existing.status === 'active') {
      return res.status(200).json({
        success: true,
        data: {
          message: 'You are already subscribed to our newsletter',
          alreadySubscribed: true
        },
        timestamp: new Date().toISOString()
      });
    }

    // If previously unsubscribed, reactivate
    if (existing && existing.status === 'unsubscribed') {
      const { error: updateError } = await supabase
        .from('newsletter_subscriptions')
        .update({
          status: 'active',
          name: name || existing.name,
          subscribed_at: new Date().toISOString(),
          unsubscribed_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error reactivating subscription:', updateError);
        return res.status(500).json({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to reactivate subscription',
            details: process.env.NODE_ENV === 'development' ? updateError.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          message: 'Successfully resubscribed to our newsletter!',
          reactivated: true
        },
        timestamp: new Date().toISOString()
      });
    }

    // Create new subscription
    const { error: insertError } = await supabase
      .from('newsletter_subscriptions')
      .insert({
        email,
        name: name || null,
        status: 'active',
        subscribed_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error creating subscription:', insertError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to subscribe to newsletter',
          details: process.env.NODE_ENV === 'development' ? insertError.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        message: 'Successfully subscribed to our newsletter!',
        newSubscription: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

export default withErrorHandler(handler);

