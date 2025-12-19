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

async function fixUserRole() {
  try {
    console.log('Fetching all users...');
    
    // Get all users
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError);
      return;
    }
    
    console.log(`Found ${userData.users.length} users:`);
    
    // List all users
    userData.users.forEach(user => {
      console.log(`- Email: ${user.email}, ID: ${user.id}, Role: ${user.user_metadata?.role || 'not set'}`);
    });
    
    // Find users that might need admin access
    const adminCandidates = userData.users.filter(u => 
      u.email.includes('voice') || 
      u.email.includes('admin') || 
      u.email.includes('akayetb') ||  // Added this email pattern
      u.user_metadata?.role === 'admin' ||
      u.user_metadata?.role === 'editor'
    );
    
    console.log('\nAdmin/Editor candidates:');
    adminCandidates.forEach(user => {
      console.log(`- Email: ${user.email}, Current Role: ${user.user_metadata?.role || 'not set'}`);
    });
    
    // Update the first candidate to 'editor' role
    if (adminCandidates.length > 0) {
      const user = adminCandidates[0];
      console.log(`\nUpdating user ${user.email} to 'editor' role...`);
      
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: {
            ...user.user_metadata,
            role: 'editor'
          }
        }
      );
      
      if (updateError) {
        console.error('Error updating user role:', updateError);
        return;
      }
      
      console.log('User role updated successfully!');
      console.log('Updated metadata:', updateData.user.user_metadata);
    } else {
      console.log('No admin/editor candidates found. You may need to manually update a user role.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixUserRole();
