const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTableAndPermissions() {
  console.log('Creating user_profiles table and setting permissions...')
  
  try {
    // Create the table if it doesn't exist
    console.log('Creating user_profiles table...')
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.user_profiles (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        email text,
        name text,
        avatar_url text,
        bio text,
        location text,
        website text,
        social_links jsonb DEFAULT '{}',
        preferences jsonb DEFAULT '{}',
        notification_settings jsonb DEFAULT '{}',
        privacy_settings jsonb DEFAULT '{}',
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now(),
        last_active timestamp with time zone,
        is_active boolean DEFAULT true,
        email_verified boolean DEFAULT false,
        role text DEFAULT 'user',
        status text DEFAULT 'active'
      );
      
      -- Enable RLS
      ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies
      DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
      DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
      DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
      DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;
      
      -- Create policies
      CREATE POLICY "Users can view own profile" ON public.user_profiles
        FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can update own profile" ON public.user_profiles
        FOR UPDATE USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can insert own profile" ON public.user_profiles
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Users can delete own profile" ON public.user_profiles
        FOR DELETE USING (auth.uid() = user_id);
      
      -- Grant permissions
      GRANT ALL ON public.user_profiles TO authenticated;
      GRANT ALL ON public.user_profiles TO service_role;
      GRANT SELECT ON public.user_profiles TO anon;
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
      CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at);
      
      -- Create trigger for updated_at
      CREATE OR REPLACE FUNCTION public.handle_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      DROP TRIGGER IF EXISTS handle_user_profiles_updated_at ON public.user_profiles;
      CREATE TRIGGER handle_user_profiles_updated_at
        BEFORE UPDATE ON public.user_profiles
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_updated_at();
    `
    
    // Execute the SQL using fetch directly to Supabase REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: createTableSQL
      })
    })
    
    if (!response.ok) {
      console.error('Failed to create table:', await response.text())
    } else {
      console.log('Table created and permissions set successfully')
    }
    
    // Test access
    console.log('\n=== Testing Access ===')
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.error('Test failed:', testError)
    } else {
      console.log('SUCCESS: Access working, found', testData.length, 'profiles')
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

createTableAndPermissions()
