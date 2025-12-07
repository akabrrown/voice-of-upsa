import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Debug API to test admin ads endpoint
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('=== DEBUG ADMIN ADS API ===');
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      url: supabaseUrl?.substring(0, 20) + '...'
    });

    // Use service role key for admin access (bypasses RLS)
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Test direct database access
    console.log('Testing direct database access...');
    
    const { data: submissions, error } = await supabase
      .from('ad_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      return res.status(500).json({ 
        message: 'Database error',
        error: error.message,
        code: error.code,
        details: error.details
      });
    }

    console.log(`Found ${submissions?.length || 0} ad submissions`);
    
    // Log first submission for debugging
    if (submissions && submissions.length > 0) {
      console.log('First submission:', {
        id: submissions[0].id,
        email: submissions[0].email,
        status: submissions[0].status,
        created_at: submissions[0].created_at
      });
    }

    // Test table structure
    console.log('Testing table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'ad_submissions')
      .eq('table_schema', 'public');

    if (tableError) {
      console.log('Could not fetch table info:', tableError.message);
    } else {
      console.log('Table columns:', tableInfo?.map(col => col.column_name));
    }

    console.log('=== DEBUG ADMIN ADS API COMPLETED ===');

    res.status(200).json({ 
      message: 'Debug completed successfully',
      submissions: submissions || [],
      count: submissions?.length || 0,
      environment: {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      }
    });

  } catch (error) {
    console.error('=== DEBUG ADMIN ADS API FAILED ===');
    console.error('Error:', error);
    
    res.status(500).json({ 
      message: 'Debug failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
