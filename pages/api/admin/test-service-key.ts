import { NextApiRequest, NextApiResponse } from 'next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Test basic connection with service role key
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
      }
    });

    console.log('Supabase URL:', supabaseUrl);
    console.log('Service Key exists:', !!supabaseServiceKey);
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      const error = await response.text();
      return res.status(400).json({
        error: 'Service role key authentication failed',
        status: response.status,
        details: error,
        url: supabaseUrl,
        hasKey: !!supabaseServiceKey
      });
    }

    return res.status(200).json({
      message: 'Service role key is working',
      url: supabaseUrl,
      hasKey: !!supabaseServiceKey
    });

  } catch (error) {
    console.error('Test error:', error);
    return res.status(500).json({
      error: 'Connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
