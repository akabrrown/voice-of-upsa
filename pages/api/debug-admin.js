// Debug admin authentication - save as pages/api/debug-admin.js
// This will help identify why the admin page isn't working

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    // Check all admin users
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('email, name, role, created_at')
      .eq('role', 'admin');

    if (adminError) {
      return res.status(500).json({ error: 'Failed to check admin users', details: adminError });
    }

    // Check all ad submissions
    const { data: ads, error: adsError } = await supabase
      .from('ad_submissions')
      .select('id, ad_title, ad_type, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (adsError) {
      return res.status(500).json({ error: 'Failed to check ads', details: adsError });
    }

    return res.status(200).json({
      adminUsers: adminUsers || [],
      recentAds: ads || [],
      message: 'Check if you are logged in with one of these admin emails'
    });

  } catch (error) {
    return res.status(500).json({ error: 'Debug failed', details: error.message });
  }
}
