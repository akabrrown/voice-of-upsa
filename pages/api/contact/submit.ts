import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { sendContactNotification } from '@/lib/email-service';
import { z } from 'zod';

// Validation schema
const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email format'),
  subject: z.string().max(500).optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
  phone: z.string().max(50).optional()
});

// Rate limiting: 3 submissions per hour per IP
const rateLimitMiddleware = withRateLimit(3, 60 * 60 * 1000, (req) => 
  req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown'
);

// Input sanitization middleware
const sanitizeMiddleware = (req: NextApiRequest) => {
  const fields = ['name', 'email', 'subject', 'message', 'phone'];
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
    // Apply rate limiting
    rateLimitMiddleware(req);

    // Validate and sanitize input
    contactSchema.parse(req.body);
    sanitizeMiddleware(req);
    const { name, email, subject, message, phone } = req.body;

    // Get IP address and user agent for tracking
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                      req.socket.remoteAddress || 
                      null;
    const userAgent = req.headers['user-agent'] || null;

    // Insert contact submission
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabaseAdmin as any)
      .from('contact_submissions')
      .insert({
        name,
        email,
        subject: subject || null,
        message,
        phone: phone || null,
        status: 'new',
        priority: 'normal',
        ip_address: ipAddress,
        user_agent: userAgent
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating contact submission:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to submit contact form',
          details: process.env.NODE_ENV === 'development' ? error.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Log successful submission
    console.info('Contact form submitted:', {
      id: data.id,
      email,
      timestamp: new Date().toISOString()
    });

    // Send email notification to admin
    try {
      const emailResult = await sendContactNotification({
        name,
        email,
        subject: subject || undefined,
        message,
        phone: phone || undefined
      });
      
      if (emailResult.success) {
        console.info('Email notification sent successfully:', emailResult.messageId);
      } else {
        console.warn('Failed to send email notification:', emailResult.message);
        // Don't fail the request if email fails, just log it
      }
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Don't fail the request if email fails, just log it
    }

    return res.status(201).json({
      success: true,
      data: {
        message: 'Thank you for contacting us! We will get back to you soon.',
        submissionId: data.id
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Contact form error:', error);
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

