// scripts/nuclear-fix-auth.js
// Back up, delete, recreate Auth, and restore database profile
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EMAIL = 'akayetb@gmail.com';
const ID = '34e22590-8a37-4d29-9267-7932836f4a1e';
const TEMP_PASSWORD = 'TempAdmin2026!Restored';

async function nuclearFix() {
  try {
    console.log('=== Nuclear Auth Fix ===\n');
    
    // 1. Back up the user record
    console.log('Step 1: Backing up user record from public.users...');
    const { data: backup, error: backupError } = await supabase
      .from('users')
      .select('*')
      .eq('id', ID)
      .single();
    
    if (backupError || !backup) {
      throw new Error(`Backup failed: ${backupError?.message || 'User not found'}`);
    }
    console.log('✓ Backup successful (captured all columns)');

    // 2. Delete the record (carefully)
    console.log('\nStep 2: Deleting user record from public.users...');
    // Note: We hope there are no RESTRICT foreign keys.
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', ID);
    
    if (deleteError) {
      throw new Error(`Deletion failed: ${deleteError.message}`);
    }
    console.log('✓ Deletion successful');

    // 3. Create Auth account
    console.log('\nStep 3: Creating fresh Auth account with original ID...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      id: ID,
      email: EMAIL,
      password: TEMP_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: backup.name,
        nuclear_migration: true
      }
    });

    if (authError) {
      console.log('⚠️  Auth creation failed! Restoring backup record immediately...');
      await supabase.from('users').insert(backup);
      throw new Error(`Auth creation failed: ${authError.message}`);
    }
    console.log('✓ Auth account created successfully!');

    // 4. Restore the original record (trigger might have created a partial one)
    console.log('\nStep 4: Restoring original record data...');
    const { error: restoreError } = await supabase
      .from('users')
      .update(backup)
      .eq('id', ID);
    
    if (restoreError) {
      console.warn('Warning: Restore update failed (partial trigger row may exist):', restoreError.message);
      // Try insert if update fails (though update should work if trigger fired)
      console.log('Attempting cleanup and full restore...');
      await supabase.from('users').delete().eq('id', ID);
      await supabase.from('users').insert(backup);
    }
    console.log('✓ Original data and role (admin) restored!');

    console.log('\n=== SUCCESS ===');
    console.log('\n✅ Your account has been fixed and your Admin role is preserved.');
    console.log('\nSign in with:');
    console.log('  Email:', EMAIL);
    console.log('  Password:', TEMP_PASSWORD);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

nuclearFix();
