// scripts/migrate-orphaned-users.js
// One-time migration to adopt all orphaned users into Supabase Auth
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Generate a secure random password
function generateTempPassword() {
  return crypto.randomBytes(16).toString('hex') + 'Aa1!';
}

async function migrateOrphanedUsers() {
  try {
    console.log('=== Orphaned User Migration ===\n');
    
    // Step 1: Get all users from public.users
    console.log('Step 1: Fetching all users from public.users...');
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('id, email, name, role');
    
    if (publicError) {
      throw new Error(`Failed to fetch public users: ${publicError.message}`);
    }
    
    console.log(`Found ${publicUsers.length} users in public.users\n`);
    
    // Step 2: Get all users from Auth
    console.log('Step 2: Fetching all users from Auth...');
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Failed to fetch auth users: ${authError.message}`);
    }
    
    console.log(`Found ${authUsers.length} users in Auth\n`);
    
    // Step 3: Find orphaned users
    console.log('Step 3: Identifying orphaned users...');
    const orphanedUsers = publicUsers.filter(publicUser => {
      return !authUsers.find(authUser => 
        authUser.email?.toLowerCase() === publicUser.email?.toLowerCase()
      );
    });
    
    console.log(`Found ${orphanedUsers.length} orphaned users:\n`);
    orphanedUsers.forEach(u => console.log(`  - ${u.email} (${u.role})`));
    
    if (orphanedUsers.length === 0) {
      console.log('\n✅ No orphaned users to migrate!');
      return;
    }
    
    // Step 4: Migrate each orphaned user
    console.log('\nStep 4: Migrating orphaned users to Auth...\n');
    
    const results = {
      success: [],
      failed: []
    };
    
    for (const user of orphanedUsers) {
      try {
        // Generate temporary password
        const tempPassword = generateTempPassword();
        
        console.log(`Migrating: ${user.email}...`);
        
        // Create Auth account with existing ID
        const { data, error } = await supabase.auth.admin.createUser({
          id: user.id,
          email: user.email,
          password: tempPassword,
          email_confirm: true, // Auto-confirm
          user_metadata: {
            full_name: user.name,
            migrated_account: true,
            migration_date: new Date().toISOString()
          }
        });
        
        if (error) {
          throw error;
        }
        
        results.success.push({
          email: user.email,
          role: user.role,
          tempPassword
        });
        
        console.log(`  ✅ Success`);
        
      } catch (error) {
        console.error(`  ❌ Failed: ${error.message}`);
        results.failed.push({
          email: user.email,
          error: error.message
        });
      }
    }
    
    // Step 5: Summary
    console.log('\n=== Migration Summary ===');
    console.log(`Total orphaned: ${orphanedUsers.length}`);
    console.log(`Successfully migrated: ${results.success.length}`);
    console.log(`Failed: ${results.failed.length}\n`);
    
    if (results.success.length > 0) {
      console.log('✅ Successfully migrated users:');
      console.log('IMPORTANT: Save these temporary passwords and communicate them to users!\n');
      results.success.forEach(user => {
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log(`Temporary Password: ${user.tempPassword}`);
        console.log('---');
      });
      
      console.log('\n⚠️  NEXT STEPS:');
      console.log('1. Email each user their temporary password');
      console.log('2. Ask them to sign in and change their password');
      console.log('3. Or use the password reset flow to let them set their own password\n');
    }
    
    if (results.failed.length > 0) {
      console.log('\n❌ Failed migrations:');
      results.failed.forEach(f => {
        console.log(`  - ${f.email}: ${f.error}`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrateOrphanedUsers();
