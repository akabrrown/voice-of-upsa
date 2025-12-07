import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[simple-test] API called with method:', req.method);
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('[simple-test] Environment check:', {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    urlLength: supabaseUrl?.length,
    keyLength: supabaseAnonKey?.length,
    urlStart: supabaseUrl?.substring(0, 20),
    keyStart: supabaseAnonKey?.substring(0, 10),
  });

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[simple-test] Missing environment variables');
    return res.status(500).json({ 
      error: 'Server configuration error: Missing Supabase credentials',
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
    });
  }

  // Return success without database connection
  return res.status(200).json({
    success: true,
    message: 'Simple test successful - environment variables are present',
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
  });
}
