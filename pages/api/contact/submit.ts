import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { getCMSRateLimit } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { sendContactNotification } from '@/lib/email-service';
import { CSRFProtection } from '@/lib/csrf';
import { securityMonitor } from '@/lib/security-monitor';
import { z } from 'zod';

// Enhanced validation schema with HTML tag prevention
const contactSchema = z.object({
  name: z.string().regex(/^[^<>]{1,255}$/, 'Name must be 1-255 characters and cannot contain HTML tags'),
  email: z.string().email('Invalid email format'),
  subject: z.string().regex(/^[^<>]{0,500}$/, 'Subject cannot contain HTML tags').optional(),
  message: z.string().regex(/^[^<>]{10,5000}$/, 'Message must be 10-5000 characters and cannot contain HTML tags'),
  phone: z.string().regex(/^[^<>]{0,50}$/, 'Phone cannot contain HTML tags').optional()
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Apply public-friendly rate limiting (more restrictive for contact form)
    const rateLimit = getCMSRateLimit('POST');
    const rateLimitMiddleware = withRateLimit(rateLimit.requests, rateLimit.window, (req: NextApiRequest) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    // Log public contact submission access
    console.log(`Public contact submit API accessed`, {
      method: req.method,
      ip: getClientIP(req),
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });

    // Only allow POST for contact submission
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only POST method is allowed for contact submission',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Apply CSRF protection
    if (!CSRFProtection.protect(req)) {
      await securityMonitor.logCSRFFailure(req);
      return res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_INVALID',
          message: 'Invalid CSRF token',
          details: 'Please refresh the page and try again'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Validate input with enhanced schema
    let validatedData;
    try {
      validatedData = contactSchema.parse(req.body);
    } catch (validationError) {
      console.error('Contact form validation error:', validationError);
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid form data',
          details: validationError instanceof Error ? validationError.message : 'Please check all required fields'
        },
        timestamp: new Date().toISOString()
      });
    }
    const { name, email, subject, message, phone } = validatedData;

    // Additional input sanitization
    const sanitizeInput = (input: string) => {
      return input
        .trim()
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .replace(/data:/gi, '');
    };

    const sanitizedData = {
      name: sanitizeInput(name),
      email: sanitizeInput(email),
      subject: subject ? sanitizeInput(subject) : null,
      message: sanitizeInput(message),
      phone: phone ? sanitizeInput(phone) : null
    };

    // Get IP address and user agent for tracking
    const ipAddress = getClientIP(req);
    const userAgent = req.headers['user-agent'] || null;

    // Insert contact submission with sanitized data
    const admin = await getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as unknown as any)
      .from('contact_submissions')
      .insert({
        name: sanitizedData.name,
        email: sanitizedData.email,
        subject: sanitizedData.subject || undefined,
        message: sanitizedData.message,
        phone: sanitizedData.phone || undefined,
        ip_address: ipAddress,
        user_agent: userAgent
      })
      .select()
      .single() as { data: { id: string; created_at: string } | null; error: { message: string; details?: string } | null };

    if (error) {
      console.error('Contact submission database error:', error);
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
    console.log(`Contact form submitted successfully`, {
      submissionId: data?.id,
      email: sanitizedData.email,
      ip: ipAddress,
      timestamp: new Date().toISOString()
    });

    // Send email notification to admin (async, non-blocking)
    const emailData = {
      name: sanitizedData.name,
      email: sanitizedData.email,
      message: sanitizedData.message,
      ...(sanitizedData.subject && { subject: sanitizedData.subject }),
      ...(sanitizedData.phone && { phone: sanitizedData.phone })
    };
    
    sendContactNotification(emailData).then(emailResult => {
      if (emailResult.success) {
        console.log(`Contact email notification sent: ${emailResult.messageId}`);
      } else {
        console.error('Failed to send contact email notification:', emailResult.error);
      }
    }).catch(emailError => {
      console.error('Contact email notification error:', emailError);
    });

    return res.status(201).json({
      success: true,
      message: 'Contact form submitted successfully',
      data: {
        id: data?.id,
        created_at: data?.created_at
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Public contact submit API error:', error);
    
    // Log security incident if validation error
    if (error instanceof Error && error.message.includes('HTML tags')) {
      await securityMonitor.logSuspiciousActivity(req, 'Contact form HTML injection attempt', {
        error: error.message,
        body: req.body
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while submitting the contact form',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply enhanced error handler
export default withErrorHandler(handler);
      
