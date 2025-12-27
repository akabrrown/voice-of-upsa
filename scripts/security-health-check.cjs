const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

/**
 * VOICE OF UPSA - Security Health Check Tool
 * This script verifies Row Level Security (RLS) is correctly blocking unauthorized access.
 * 
 * Usage: npm run security-check
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !anonKey || !serviceKey) {
  console.error('❌ Missing environment variables in .env.local')
  process.exit(1)
}

const supabaseAnon = createClient(supabaseUrl, anonKey)
const supabaseAdmin = createClient(supabaseUrl, serviceKey)

async function run() {
  console.log('--- SECURITY STATUS REPORT ---')
  console.log(`Target: ${supabaseUrl}\n`)

  let criticalFail = false

  // TEST 1: Users Table (Critical)
  process.stdout.write('[TEST] Anonymous access to "users": ')
  const { data: users, error: userError } = await supabaseAnon
    .from('users')
    .select('email')
    .limit(1)

  if (userError && userError.message.toLowerCase().includes('permission denied')) {
    console.log('✅ SECURE (Denied)')
  } else if (users && users.length > 0) {
    console.log('❌ VULNERABLE (Data Leaked!)')
    criticalFail = true
  } else {
    console.log('✅ SECURE (Filtered)')
  }

  // TEST 2: Settings Table
  process.stdout.write('[TEST] Anonymous access to "settings": ')
  const { data: settings, error: settingsError } = await supabaseAnon
    .from('settings')
    .select('*')
    .limit(1)

  if (settingsError && settingsError.message.toLowerCase().includes('permission denied')) {
    console.log('✅ SECURE (Denied)')
  } else if (settings && settings.length > 0) {
    console.log('❌ VULNERABLE (Data Leaked!)')
  } else {
    console.log('✅ SECURE (Filtered)')
  }

  // TEST 3: Admin Access
  process.stdout.write('[TEST] Admin Service Role Access: ')
  const { data: adminCheck, error: adminError } = await supabaseAdmin
    .from('users')
    .select('email')
    .limit(1)

  if (!adminError && adminCheck) {
    console.log('✅ FUNCTIONAL')
  } else {
    console.log(`❌ BROKEN (${adminError?.message || 'Empty'})`)
  }

  console.log('\n------------------------------')
  if (criticalFail) {
    console.log('🚨 FINAL STATUS: INSECURE - Action Required!')
    console.log('Note: Please run the SQL hardening script provided in the walkthrough.')
    process.exit(1)
  } else {
    console.log('🎉 FINAL STATUS: SECURE')
  }
}

run()
