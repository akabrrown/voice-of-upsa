// Test script to validate the token validation logic
// This will help identify why the CMS security middleware is rejecting tokens

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create Supabase admin client (same as CMS security)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testTokenValidation() {
  try {
    console.log('=== TESTING TOKEN VALIDATION ===');
    
    // Test 1: Try with a dummy token to see the error
    console.log('\n1. Testing with dummy token:');
    const dummyToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy.token.payload';
    
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(dummyToken);
      console.log('Dummy token result:', {
        hasUser: !!user,
        error: error?.message,
        errorCode: error?.name
      });
    } catch (err) {
      console.log('Dummy token exception:', err.message);
    }
    
    // Test 2: Try with no token
    console.log('\n2. Testing with no token:');
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(null);
      console.log('No token result:', {
        hasUser: !!user,
        error: error?.message,
        errorCode: error?.name
      });
    } catch (err) {
      console.log('No token exception:', err.message);
    }
    
    // Test 3: Try with empty string
    console.log('\n3. Testing with empty string:');
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser('');
      console.log('Empty string result:', {
        hasUser: !!user,
        error: error?.message,
        errorCode: error?.name
      });
    } catch (err) {
      console.log('Empty string exception:', err.message);
    }
    
    // Test 4: Check if we can get a real token by signing in
    console.log('\n4. Attempting to get real token via sign in:');
    const supabaseClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: 'akayetb@gmail.com',
        password: 'password123' // This will likely fail but shows the process
      });
      
      if (error) {
        console.log('Sign in failed (expected):', error.message);
      } else if (data.session?.access_token) {
        console.log('Got real token, testing validation...');
        const realToken = data.session.access_token;
        
        const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(realToken);
        console.log('Real token validation result:', {
          hasUser: !!tokenUser,
          userId: tokenUser?.id,
          userEmail: tokenUser?.email,
          error: tokenError?.message
        });
      }
    } catch (err) {
      console.log('Sign in exception:', err.message);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testTokenValidation();
