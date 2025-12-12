import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { getCMSRateLimit } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Enhanced validation schema with HTML tag prevention
const subscribeSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().regex(/^[^<>]{1,255}$/, 'Name must be 1-255 characters and cannot contain HTML tags').optional()
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Apply public-friendly rate limiting (more restrictive for newsletter)
    const rateLimit = getCMSRateLimit('POST');
    const rateLimitMiddleware = withRateLimit(rateLimit.requests, rateLimit.window, (req: NextApiRequest) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    // Log public newsletter subscription access
    console.log(`Public newsletter subscribe API accessed`, {
      method: req.method,
      ip: getClientIP(req),
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });

    // Only allow POST for newsletter subscription
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only POST method is allowed for newsletter subscription',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Validate input with enhanced schema
    const validatedData = subscribeSchema.parse(req.body);
    const { email, name } = validatedData;

    // Additional input sanitization
    const sanitizeInput = (input: string) => {
      return input
        .trim()
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .replace(/data:/gi, '');
    };

    const sanitizedEmail = sanitizeInput(email);
    const sanitizedName = name ? sanitizeInput(name) : null;

    // Get IP address for tracking
    const ipAddress = getClientIP(req);

    // Check if email already exists
    const { data: existingSubscription, error: checkError } = await supabaseAdmin
      .from('newsletter_subscriptions')
      .select('id, email')
      .eq('email', sanitizedEmail)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Newsletter subscription check error:', checkError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to process newsletter subscription',
          details: process.env.NODE_ENV === 'development' ? checkError.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // If already subscribed, return success message
    if (existingSubscription) {
      console.log(`Newsletter subscription already exists: ${sanitizedEmail}`);
      return res.status(200).json({
        success: true,
        message: 'Email is already subscribed to the newsletter',
        timestamp: new Date().toISOString()
      });
    }

    // Insert new newsletter subscription
    const { data, error } = await supabaseAdmin
      .from('newsletter_subscriptions')
      .insert({
        email: sanitizedEmail,
        name: sanitizedName,
        status: 'active',
        ip_address: ipAddress,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Newsletter subscription database error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to subscribe to newsletter',
          details: process.env.NODE_ENV === 'development' ? error.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Log successful subscription
    console.log(`Newsletter subscription successful`, {
      subscriptionId: data.id,
      email: sanitizedEmail,
      ip: ipAddress,
      timestamp: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      message: 'Successfully subscribed to the newsletter',
      data: {
        id: data.id,
        created_at: data.created_at
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Public newsletter subscribe API error:', error);

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while subscribing to the newsletter',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply enhanced error handler
export default withErrorHandler(handler);
        
          
