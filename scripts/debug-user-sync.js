import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env file
config({ path: '.env.local' });

// Create Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugUserSync() {
  try {
    console.log('=== DEBUGGING USER SYNC ISSUE ===');
    
    // First, let's check what's happening with a direct SQL approach
    console.log('\n1. Checking current users table data...');
    const { data: currentUsers, error: currentError } = await supabase
      .from('users')
      .select('id, email, role, updated_at')
      .eq('email', 'akayetb@gmail.com');
    
    if (currentError) {
      console.error('Error fetching current user:', currentError);
    } else {
      console.log('Current user in users table:', currentUsers[0]);
    }
    
    // Try using RPC function to bypass any triggers
    console.log('\n2. Trying to update role via RPC...');
    try {
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('update_user_role', {
          user_email: 'akayetb@gmail.com',
          new_role: 'editor'
        });
      
      if (rpcError) {
        console.error('RPC error:', rpcError);
        console.log('RPC function may not exist, trying direct update...');
      } else {
        console.log('RPC update successful:', rpcData);
      }
    } catch (rpcError) {
      console.log('RPC not available, trying alternative approach...');
    }
    
    // Try a simple update without triggers
    console.log('\n3. Trying simple update approach...');
    try {
      // Disable any triggers temporarily if possible
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ 
          role: 'editor',
          updated_at: new Date().toISOString()
        })
        .eq('email', 'akayetb@gmail.com')
        .select('id, email, role, updated_at')
        .single();
      
      if (updateError) {
        console.error('Direct update error:', updateError);
        
        // Let's check if there are any triggers causing issues
        console.log('\n4. Checking for problematic triggers...');
        try {
          const { data: triggers, error: triggerError } = await supabase
            .from('information_schema.triggers')
            .select('trigger_name, event_manipulation, action_timing')
            .eq('event_object_table', 'users');
          
          if (triggerError) {
            console.log('Cannot check triggers (expected for admin client)');
          } else {
            console.log('Triggers on users table:', triggers);
          }
        } catch (err) {
          console.log('Cannot access triggers table');
        }
        
      } else {
        console.log('Direct update successful:', updateData);
      }
    } catch (error) {
      console.error('Update attempt failed:', error);
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugUserSync();
