import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== SETTINGS TABLE DEBUG ===');
  
  const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
  
  try {
    // Check if table exists
    const { data: tables, error: tableError } = await supabase
      .from('settings')
      .select('*')
      .limit(1);
    
    console.log('Table check result:', tables);
    console.log('Table error:', tableError);
    
    // Get table schema
    const { data: schema, error: schemaError } = await supabase
      .rpc('get_table_schema', { table_name: 'settings' });
    
    console.log('Schema:', schema);
    console.log('Schema error:', schemaError);
    
    return res.status(200).json({
      tables,
      tableError,
      schema,
      schemaError,
    });
  } catch (error) {
    console.error('Debug error:', error);
    return res.status(500).json({ error: 'Debug error' });
  }
}
