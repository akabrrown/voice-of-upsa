import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Test with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          apikey: supabaseServiceKey,
        }
      }
    });

    // Test 1: Check if table exists
    const { data: tableTest, error: tableError } = await supabase
      .from('settings')
      .select('count')
      .limit(1);

    console.log('Table test:', { tableTest, tableError });

    // Test 2: Try to insert a test record
    const { data: insertTest, error: insertError } = await supabase
      .from('settings')
      .upsert({
        id: 999, // Test ID
        site_name: 'Test Record',
        site_description: 'Test description'
      })
      .select();

    console.log('Insert test:', { insertTest, insertError });

    // Clean up test record
    if (insertTest) {
      await supabase
        .from('settings')
        .delete()
        .eq('id', 999);
    }

    return res.status(200).json({
      tableTest: !!tableTest,
      tableError: tableError?.message,
      insertTest: !!insertTest,
      insertError: insertError?.message,
      message: 'Test completed'
    });

  } catch (error) {
    console.error('Test error:', error);
    return res.status(500).json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
