const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixRLS() {
  console.log('Fixing RLS policies for user_profiles table...')
  
  try {
    // Enable RLS
    await supabase.rpc('exec', { sql: 'ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY' })
    console.log('RLS enabled on user_profiles table')
    
    // Drop existing policies
    const policies = [
      "Users can view own profile",
      "Users can update own profile", 
      "Users can insert own profile",
      "Users can delete own profile",
      "Admins have full access to user_profiles",
      "Enable read access for all users based on user_id",
      "Enable insert for authenticated users based on user_id",
      "Enable update for users based on user_id",
      "Users can view their own profile",
      "Users can update their own profile",
      "Users can insert their own profile",
      "Users can delete their own profile"
    ]
    
    for (const policy of policies) {
      await supabase.rpc('exec', { sql: `DROP POLICY IF EXISTS "${policy}" ON user_profiles` })
      console.log(`Dropped policy: ${policy}`)
    }
    
    // Create new policies
    const newPolicies = [
      {
        name: "Users can view own profile",
        definition: `CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id)`
      },
      {
        name: "Users can update own profile", 
        definition: `CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id)`
      },
      {
        name: "Users can insert own profile",
        definition: `CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id)`
      },
      {
        name: "Users can delete own profile",
        definition: `CREATE POLICY "Users can delete own profile" ON user_profiles FOR DELETE USING (auth.uid() = user_id)`
      }
    ]
    
    for (const policy of newPolicies) {
      await supabase.rpc('exec', { sql: policy.definition })
      console.log(`Created policy: ${policy.name}`)
    }
    
    // Grant permissions
    await supabase.rpc('exec', { sql: 'GRANT ALL ON user_profiles TO authenticated' })
    await supabase.rpc('exec', { sql: 'GRANT SELECT ON user_profiles TO anon' })
    console.log('Granted permissions to authenticated and anon roles')
    
    // Verify policies
    const { data, error } = await supabase.rpc('exec', { 
      sql: `SELECT schemaname, tablename, policyname, permissive, roles, cmd 
             FROM pg_policies 
             WHERE tablename = 'user_profiles' AND schemaname = 'public'` 
    })
    
    if (error) {
      console.error('Error verifying policies:', error)
    } else {
      console.log('Current policies:', data)
    }
    
    console.log('RLS fix completed successfully!')
    
  } catch (error) {
    console.error('Error fixing RLS:', error)
    process.exit(1)
  }
}

fixRLS()
