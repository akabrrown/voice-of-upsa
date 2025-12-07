import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Server-side Supabase client - use service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Helper function to transform snake_case database records to camelCase for client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformSubmission(record: any) {
  return {
    id: record.id,
    firstName: record.first_name,
    lastName: record.last_name,
    email: record.email,
    phone: record.phone,
    company: record.company,
    businessType: record.business_type,
    adType: record.ad_type,
    adTitle: record.ad_title,
    adDescription: record.ad_description,
    targetAudience: record.target_audience,
    budget: record.budget,
    duration: record.duration,
    startDate: record.start_date,
    website: record.website,
    additionalInfo: record.additional_info,
    termsAccepted: record.terms_accepted,
    attachmentUrls: record.attachment_urls,
    status: record.status,
    paymentStatus: record.payment_status,
    paymentReference: record.payment_reference,
    paymentAmount: record.payment_amount,
    paymentDate: record.payment_date,
    admin_notes: record.admin_notes,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

// Schema for ad status update
const updateStatusSchema = z.object({
  status: z.enum(['pending', 'under-review', 'approved', 'rejected', 'published']),
  adminNotes: z.string().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check environment variables at runtime
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[admin/ads] Missing Supabase environment variables:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
    });
    return res.status(200).json({ 
      submissions: [],
      message: 'Database not configured. Please check environment variables.',
    });
  }

  try {
    // Get the auth token from request
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    // Create Supabase client with service role key for admin operations (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log('[admin/ads] Auth error:', authError?.message || 'No user');
      return res.status(401).json({ 
        error: 'Unauthorized - Invalid token',
        details: authError?.message,
      });
    }

    // Check if user is admin from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('[admin/ads] User lookup error:', userError);
      return res.status(403).json({ 
        error: 'Failed to verify user permissions',
        details: userError.message,
        code: userError.code,
      });
    }

    if (!userData || userData.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Insufficient permissions - Admin access required',
        userRole: userData?.role || 'none',
      });
    }

    // GET - Fetch all ad submissions
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('ad_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[admin/ads] Error fetching ad submissions:', error);
        
        // Check if table doesn't exist
        const errorCode = error.code;
        if (
          error.message.includes('relation') ||
          error.message.includes('does not exist') ||
          errorCode === '42P01'
        ) {
          return res.status(200).json({ 
            submissions: [],
            message: 'Ad submissions table not created yet.',
          });
        }

        // Check for permission denied
        if (errorCode === '42501') {
          return res.status(200).json({ 
            submissions: [],
            message: 'Permission denied. RLS policies may need to be updated.',
            error: error.message,
          });
        }
        
        return res.status(500).json({ 
          error: 'Failed to fetch ad submissions',
          details: error.message,
          code: errorCode,
        });
      }

      return res.status(200).json({ submissions: (data || []).map(transformSubmission) });
    }

    // PUT - Update ad submission status
    if (req.method === 'PUT') {
      const { id } = req.query;
      
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid submission ID' });
      }

      const validationResult = updateStatusSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input', 
          details: validationResult.error.errors 
        });
      }

      const { status, adminNotes } = validationResult.data;

      const { data, error } = await supabase
        .from('ad_submissions')
        .update({ 
          status,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[admin/ads] Error updating ad submission:', error);
        return res.status(500).json({ error: 'Failed to update ad submission' });
      }

      return res.status(200).json({ submission: transformSubmission(data) });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[admin/ads] Admin ads API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ 
      error: 'Internal server error',
      details: errorMessage,
    });
  }
}
