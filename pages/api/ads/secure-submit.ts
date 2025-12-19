import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { getCMSRateLimit } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Validation schemas
const adSubmissionSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  businessType: z.enum(['individual', 'small-business', 'corporate', 'non-profit', 'other']),
  adTitle: z.string().min(1, 'Ad title is required'),
  adDescription: z.string().min(10, 'Ad description must be at least 10 characters'),
  budget: z.string().min(1, 'Budget information is required'),
  termsAccepted: z.boolean().refine(val => val === true, 'Terms must be accepted')
});

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
    // Apply rate limiting for ad submissions
    const rateLimit = getCMSRateLimit('POST');
    const rateLimitMiddleware = withRateLimit(rateLimit.requests, rateLimit.window, (req) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    // Handle authentication - require authenticated users
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required to submit ads',
          details: 'Please sign in to submit an advertisement'
        },
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token and get user
    const supabaseAdmin = await getSupabaseAdmin();
    const { data: { user }, error: authError } = await (await supabaseAdmin as any).auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired authentication token',
          details: 'Please sign in again'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Validate input
    const validatedData = adSubmissionSchema.parse(req.body);

    // Sanitize input to prevent XSS
    const sanitizedData = {
      ...validatedData,
      adTitle: validatedData.adTitle.replace(/<[^>]*>/g, ''),
      adDescription: validatedData.adDescription.replace(/<[^>]*>/g, ''),
      firstName: validatedData.firstName.replace(/<[^>]*>/g, ''),
      lastName: validatedData.lastName.replace(/<[^>]*>/g, '')
    };

    // Insert ad submission with pending status (requires admin approval)
    const { data: submission, error: submissionError } = await (await supabaseAdmin as any)
      .from('ad_submissions')
      .insert({
        ...sanitizedData,
        user_id: user.id,
        status: 'pending', // Requires admin approval
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (submissionError) {
      console.error('Ad submission error:', submissionError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SUBMISSION_FAILED',
          message: 'Failed to submit advertisement',
          details: process.env.NODE_ENV === 'development' ? submissionError.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    console.info(`Ad submission created by ${user.email}`, {
      submissionId: submission.id,
      status: 'pending',
      timestamp: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      data: {
        submission,
        message: 'Advertisement submitted for review. It will be visible after admin approval.'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Ad submission API error:', error);
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
