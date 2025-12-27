import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity, CMSUser } from '@/lib/security/cms-security';
import { z } from 'zod';

// Enhanced validation schemas with security constraints
const adsQuerySchema = z.object({
  search: z.string().max(100, 'Search term too long').optional(),
  status: z.enum(['all', 'pending', 'approved', 'rejected', 'published', 'archived']).default('all'),
  page: z.coerce.number().min(1).max(100, 'Page number too high').default(1)
});

// Define ad submission interface for better type safety
interface AdSubmission {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  business_type: string;
  ad_type: string;
  ad_title: string;
  ad_description: string;
  target_audience: string;
  budget: number;
  duration: number;
  start_date: string;
  website: string;
  additional_info: string;
  terms_accepted: boolean;
  attachment_urls: string[];
  status: string;
  payment_status: string;
  payment_reference: string;
  payment_amount: number;
  payment_date: string;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse, user: CMSUser) {
  const supabaseAdmin = await getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Database connection failed');
  }

  // Handle PUT - Status Update
  if (req.method === 'PUT') {
    const { id } = req.query;
    const { status, adminNotes } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'Ad ID is required' },
        timestamp: new Date().toISOString()
      });
    }

    if (!status || !['pending', 'approved', 'rejected', 'published', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'Valid status is required' },
        timestamp: new Date().toISOString()
      });
    }

    const { error: updateError } = await (supabaseAdmin as any)
      .from('ad_submissions')
      .update({
        status,
        admin_notes: adminNotes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating ad submission:', updateError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: 'Failed to update ad submission',
          details: process.env.NODE_ENV === 'development' ? updateError.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      data: { message: 'Ad submission updated successfully' },
      timestamp: new Date().toISOString()
    });
  }

  // Handle GET - List Ads
  if (req.method === 'GET') {
    // Validate query parameters
    const validatedParams = adsQuerySchema.parse(req.query);
    const { search, status, page } = validatedParams;

    const pageNum = page;
    const limit = 20;
    const offset = (pageNum - 1) * limit;

    let query = (supabaseAdmin as any)
      .from('ad_submissions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Add search filter with SQL injection protection
    if (search && typeof search === 'string') {
      const sanitizedSearch = search.replace(/[%_]/g, '\\$&');
      query = query.or(`first_name.ilike.%${sanitizedSearch}%,last_name.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%,company.ilike.%${sanitizedSearch}%`);
    }

    // Add status filter
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Ads fetch failed:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'ADS_FETCH_FAILED',
          message: 'Failed to fetch ads',
          details: process.env.NODE_ENV === 'development' ? error.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Sanitize ad data before returning
    const sanitizedAds = (data || []).map((ad: AdSubmission) => ({
      id: ad.id,
      firstName: ad.first_name,
      lastName: ad.last_name,
      email: ad.email,
      phone: ad.phone,
      company: ad.company,
      businessType: ad.business_type,
      adType: ad.ad_type,
      adTitle: ad.ad_title,
      adDescription: ad.ad_description,
      targetAudience: ad.target_audience,
      budget: ad.budget,
      duration: ad.duration,
      startDate: ad.start_date,
      website: ad.website,
      status: ad.status,
      created_at: ad.created_at,
      updated_at: ad.updated_at
    }));

    return res.status(200).json({
      success: true,
      data: {
        ads: sanitizedAds,
        pagination: {
          page: pageNum,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      },
      timestamp: new Date().toISOString()
    });
  }

  return res.status(405).json({
    success: false,
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: 'Only GET and PUT methods are allowed'
    },
    timestamp: new Date().toISOString()
  });
}

// Apply enhanced CMS security middleware and error handler
export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'manage:ads',
  auditAction: 'ads_accessed'
}));
