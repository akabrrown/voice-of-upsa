import { NextApiRequest, NextApiResponse } from 'next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
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
        console.error('SQL execution failed:', error);
        return res.status(500).json({ 
          error: 'SQL execution failed', 
          details: error 
        });
      }

      return res.status(200).json({ 
        message: 'Settings table created and RLS disabled successfully' 
      });

    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
