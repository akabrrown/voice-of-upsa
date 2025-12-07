import { NextApiRequest, NextApiResponse } from 'next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
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
        console.error('SQL execution error:', error);
        
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
          return res.status(200).json({ message: 'Settings record created successfully' });
        } else {
          const createError = await createResponse.text();
          return res.status(500).json({ 
            error: 'Failed to disable RLS and create record', 
            details: { sqlError: error, createError } 
          });
        }
      }

      return res.status(200).json({ message: 'RLS disabled successfully' });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
