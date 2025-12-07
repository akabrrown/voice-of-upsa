import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[test-stories] API called with method:', req.method);
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('[test-stories] Environment check:', {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    urlLength: supabaseUrl?.length,
    keyLength: supabaseAnonKey?.length,
  });

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[test-stories] Missing environment variables');
    return res.status(500).json({ 
      error: 'Server configuration error: Missing Supabase credentials',
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
    });
  }

  try {
    // Try to import and use Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log('[test-stories] Supabase client created');
    
    // Test simple query
    const { data, error } = await supabase
      .from('anonymous_stories')
      .select('count')
      .eq('status', 'approved');
    
    console.log('[test-stories] Query result:', { data, error });
    
    if (error) {
      console.error('[test-stories] Database error:', error);
      return res.status(500).json({ 
        error: 'Database error', 
        details: error.message,
        code: error.code,
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Test successful',
      data: data,
    });
    
  } catch (error) {
    console.error('[test-stories] Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Unexpected error', 
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
