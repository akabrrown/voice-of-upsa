// This will help identify the exact issue

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    // Check environment variables
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    };
    
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test anon key access
    let anonResult = { error: 'Not tested' };
    try {
      const { data, error } = await supabaseAnon
        .from('ad_submissions')
        .select('COUNT(*)')
        .single();
      anonResult = { data, error: error?.message || 'Success' };
    } catch (e) {
      anonResult = { error: e.message };
    }

    // Test service key access
    let serviceResult = { error: 'Not tested' };
    try {
      const { data, error } = await supabaseService
        .from('ad_submissions')
        .select('COUNT(*)')
        .single();
      serviceResult = { data, error: error?.message || 'Success' };
    } catch (e) {
      serviceResult = { error: e.message };
    }

    return res.status(200).json({
      environment: env,
      anonKeyTest: anonResult,
      serviceKeyTest: serviceResult,
    });

  } catch (error) {
    return res.status(500).json({ error: 'Check failed', details: error.message });
  }
}
