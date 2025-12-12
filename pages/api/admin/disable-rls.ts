import { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity } from '@/lib/security/cms-security';

async function handler(req: NextApiRequest, res: NextApiResponse, user: { id: string; email: string; securityLevel?: string }) {
  try {
    // Only allow POST for RLS disable
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only POST method is allowed for RLS disable',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Log admin RLS disable action
    console.log(`Admin RLS disable initiated`, {
      adminId: user.id,
      adminEmail: user.email,
      timestamp: new Date().toISOString()
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    // Use the service role key to execute raw SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
      },
      body: JSON.stringify({
        sql: 'ALTER TABLE settings DISABLE ROW LEVEL SECURITY;'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Admin RLS disable SQL execution error:', error);
      
      // Try alternative approach - create table without RLS
      const createResponse = await fetch(`${supabaseUrl}/rest/v1/settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          site_name: 'Voice of UPSA',
          site_description: 'Official student publication of UPSA',
          site_url: 'http://localhost:3000',
          logo_url: '/logo.jpg',
          contact_email: 'voice.of.upsa.mail@gmail.com',
          notification_email: 'voice.of.upsa.mail@gmail.com',
          social_facebook: '',
          social_twitter: '',
          social_instagram: '',
          social_youtube: '',
          social_tiktok: '',
          social_linkedin: '',
          maintenance_mode: false,
          allow_comments: true,
          moderate_comments: false,
          max_upload_size: 5242880,
          allowed_image_types: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
          ad_enabled: true,
          ad_auto_approve: false,
          ad_max_per_user: 5
        })
      });

      if (createResponse.ok) {
        console.log(`Admin RLS disable fallback - settings record created`, {
          adminId: user.id,
          timestamp: new Date().toISOString()
        });
        
        return res.status(200).json({
          success: true,
          message: 'Settings record created successfully (RLS disable failed)',
          data: {
            created_by: user.id,
            created_at: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });
      } else {
        const createError = await createResponse.text();
        console.error('Admin RLS disable fallback failed:', createError);
        
        return res.status(500).json({ 
          success: false,
          error: {
            code: 'RLS_DISABLE_FAILED',
            message: 'Failed to disable RLS and create record',
            details: process.env.NODE_ENV === 'development' ? { sqlError: error, createError } : null
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    // Log successful RLS disable
    console.log(`Admin RLS disabled successfully`, {
      adminId: user.id,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'RLS disabled successfully',
      data: {
        disabled_by: user.id,
        disabled_at: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin RLS disable API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while disabling RLS',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply CMS security middleware and enhanced error handler
export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'admin:setup',
  auditAction: 'rls_disabled'
}));
