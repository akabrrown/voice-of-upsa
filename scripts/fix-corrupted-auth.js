// scripts/fix-corrupted-auth.js
// Fix corrupted Auth entries by querying by email and cleaning up
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EMAIL = 'akayetb@gmail.com';
const TEMP_PASSWORD = 'TempAdmin2026!ChangeMe';

async function fixCorruptedAuth() {
  try {
    console.log('=== Fixing Corrupted Auth Account ===\n');
    console.log('Target email:', EMAIL);
    
    // Step 1: Get user info from public.users
    console.log('\nStep 1: Getting user info from database...');
    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .select('id, email, role, name')
      .ilike('email', EMAIL)
      .single();
    
    if (publicError || !publicUser) {
      throw new Error('User not found in public.users database');
    }
    
    console.log('✓ Found user in database:');
    console.log('  ID:', publicUser.id);
    console.log('  Email:', publicUser.email);
    console.log('  Role:', publicUser.role);
    console.log('  Name:', publicUser.name);
    
    // Step 2: Try to find and delete any existing Auth user with this email
    console.log('\nStep 2: Searching for existing Auth account...');
    
    // Get ALL users with pagination to ensure we find any hidden ones
    let allAuthUsers = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page: page,
        perPage: 1000
      });
      
      if (error) {
        console.warn('Warning: Error fetching page', page, '-', error.message);
        break;
      }
      
      if (data && data.users) {
        allAuthUsers = allAuthUsers.concat(data.users);
        hasMore = data.users.length === 1000;
        page++;
      } else {
        hasMore = false;
      }
    }
    
    console.log(`  Scanned ${allAuthUsers.length} total Auth users across ${page} pages`);
    
    const existingAuthUser = allAuthUsers.find(u => 
      u.email?.toLowerCase() === EMAIL.toLowerCase()
    );
    
    if (existingAuthUser) {
      console.log('  ✓ Found existing Auth user with ID:', existingAuthUser.id);
      console.log('\nStep 3: Deleting existing Auth account...');
      
      const { error: deleteError } = await supabase.auth.admin.deleteUser(
        existingAuthUser.id
      );
      
      if (deleteError) {
        throw new Error(`Failed to delete existing Auth user: ${deleteError.message}`);
      }
      
      console.log('  ✓ Deleted successfully');
    } else {
      console.log('  ℹ No visible Auth account found (may be ghost/soft-deleted)');
    }
    
    // Step 4: Temporarily change email in public.users to avoid unique constraint conflict during trigger
    console.log('\nStep 4: Temporarily changing email in public.users to bypass conflict...');
    const tempEmail = `migrating_${Date.now()}_${EMAIL}`;
    const { error: renameError } = await supabase
      .from('users')
      .update({ email: tempEmail })
      .eq('id', publicUser.id);
    
    if (renameError) {
      throw new Error(`Failed to temporarily rename user: ${renameError.message}`);
    }
    console.log('  ✓ Renamed to:', tempEmail);

    // Step 5: Wait a moment for deletion/rename to propagate
    console.log('\nWaiting 5 seconds for changes to propagate...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 6: Create fresh Auth account with existing ID
    console.log('\nStep 5: Creating new Auth account with existing ID...');
    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      id: publicUser.id,
      email: EMAIL, // Original email
      password: TEMP_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: publicUser.name,
        migrated_account: true,
        migration_date: new Date().toISOString()
      }
    });
    
    if (createError) {
      // Revert rename on failure
      await supabase.from('users').update({ email: EMAIL }).eq('id', publicUser.id);
      throw new Error(`Failed to create Auth account: ${createError.message}`);
    }
    
    console.log('  ✓ Auth account created successfully!');
    console.log('  Auth ID:', authData.user.id);
    console.log('  Database ID:', publicUser.id);
    console.log('  IDs Match:', authData.user.id === publicUser.id ? '✓ YES' : '✗ NO');
    
    // Step 6: Verify the fix
    console.log('\nStep 5: Verifying fix...');
    const { data: { user }, error: verifyError } = await supabase.auth.admin.getUserById(
      publicUser.id
    );
    
    if (verifyError || !user) {
      throw new Error('Verification failed - cannot find newly created user');
    }
    
    console.log('  ✓ Verification successful!');
    
    console.log('\n=== SUCCESS! ===');
    console.log('\n✅ Your account has been fixed!');
    console.log('\nYou can now sign in with:');
    console.log('  Email:', publicUser.email);
    console.log('  Password:', TEMP_PASSWORD);
    console.log('\n⚠️  IMPORTANT: Change your password immediately after signing in!');
    console.log('  Go to: Profile Settings → Change Password');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

fixCorruptedAuth();
