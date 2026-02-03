const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runFix() {
  console.log('Running ad permissions fix via RPC...');
  
  const sql = `
    DO $$ 
    BEGIN 
      -- 1. Grant base permissions
      GRANT SELECT ON public.ad_submissions TO anon;
      GRANT SELECT ON public.ad_submissions TO authenticated;
      
      -- 2. Ensure RLS is active
      ALTER TABLE public.ad_submissions ENABLE ROW LEVEL SECURITY;
      
      -- 3. Re-enforce the public view policy
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ad_submissions' 
        AND policyname = 'Public can view published and approved ads'
      ) THEN
        CREATE POLICY "Public can view published and approved ads"
        ON public.ad_submissions
        FOR SELECT
        TO public
        USING (status IN ('published', 'approved'));
      END IF;
    END $$;
    SELECT json_build_object('success', true) as result;
  `;

  const { data, error } = await supabase.rpc('exec', { sql });

  if (error) {
    console.error('Error running fix RPC:', error);
    return;
  }

  console.log('Fix applied successfully:', data);
}

runFix();
