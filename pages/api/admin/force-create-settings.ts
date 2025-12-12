import { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity } from '@/lib/security/cms-security';

async function handler(req: NextApiRequest, res: NextApiResponse, user: { id: string; email: string; securityLevel?: string }) {
  try {
    // Only allow POST for settings creation
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only POST method is allowed for settings creation',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Log admin settings creation action
    console.log(`Admin force settings creation initiated`, {
      adminId: user.id,
      adminEmail: user.email,
      timestamp: new Date().toISOString()
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    // Use direct REST API to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: `
          -- Drop all RLS policies first
          DROP POLICY IF EXISTS "Admins can manage settings" ON settings;
          DROP POLICY IF EXISTS "Users can view settings" ON settings;
          DROP POLICY IF EXISTS ANY ON settings;
          
          -- Disable RLS completely
          ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
          
          -- Create table if not exists (without RLS)
          CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY DEFAULT 1,
            site_name VARCHAR(255) DEFAULT 'Voice of UPSA',
            site_description TEXT DEFAULT 'Official student publication of UPSA',
            site_url VARCHAR(255) DEFAULT 'http://localhost:3000',
            logo_url VARCHAR(500) DEFAULT '/logo.jpg',
            contact_email VARCHAR(255) DEFAULT 'voice.of.upsa.mail@gmail.com',
            notification_email VARCHAR(255) DEFAULT 'voice.of.upsa.mail@gmail.com',
            social_facebook VARCHAR(500) DEFAULT '',
            social_twitter VARCHAR(500) DEFAULT '',
            social_instagram VARCHAR(500) DEFAULT '',
            social_youtube VARCHAR(500) DEFAULT '',
            social_tiktok VARCHAR(500) DEFAULT '',
            social_linkedin VARCHAR(500) DEFAULT '',
            maintenance_mode BOOLEAN DEFAULT false,
            allow_comments BOOLEAN DEFAULT true,
            moderate_comments BOOLEAN DEFAULT false,
            max_upload_size INTEGER DEFAULT 5242880,
            allowed_image_types TEXT[] DEFAULT ARRAY['jpg', 'jpeg', 'png', 'gif', 'webp'],
            ad_enabled BOOLEAN DEFAULT true,
            ad_auto_approve BOOLEAN DEFAULT false,
            ad_max_per_user INTEGER DEFAULT 5,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Insert default data if table is empty
          INSERT INTO settings (
            site_name, site_description, site_url, logo_url,
            contact_email, notification_email, 
            social_facebook, social_twitter, social_instagram, social_youtube, social_tiktok, social_linkedin,
            maintenance_mode, allow_comments, moderate_comments, max_upload_size, allowed_image_types,
            ad_enabled, ad_auto_approve, ad_max_per_user
          )
          SELECT 
            'Voice of UPSA', 'Official student publication of UPSA', 'http://localhost:3000', '/logo.jpg',
            'voice.of.upsa.mail@gmail.com', 'voice.of.upsa.mail@gmail.com',
            '', '', '', '', '', '',
            false, true, false, 5242880, ARRAY['jpg', 'jpeg', 'png', 'gif', 'webp'],
            true, false, 5
          WHERE NOT EXISTS (SELECT 1 FROM settings);
        `
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Admin force settings creation SQL execution failed:', error);
      return res.status(500).json({ 
        success: false,
        error: {
          code: 'SQL_EXECUTION_FAILED',
          message: 'SQL execution failed',
          details: process.env.NODE_ENV === 'development' ? error : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Log successful settings creation
    console.log(`Admin force settings created successfully`, {
      adminId: user.id,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'Settings table created and RLS disabled successfully',
      data: {
        created_by: user.id,
        created_at: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin force settings creation API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while creating settings table',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply CMS security middleware and enhanced error handler
export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'admin:setup',
  auditAction: 'settings_force_created'
}));
