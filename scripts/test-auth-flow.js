// Test script to debug the authentication token issue
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create Supabase client with anon key (same as frontend)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthFlow() {
  try {
    console.log('=== TESTING AUTHENTICATION FLOW ===');
    
    // Step 1: Try to sign in with test credentials
    console.log('\n1. Attempting to sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'akayetb@gmail.com',
      password: 'password123', // You'll need to provide the actual password
    });
    
    if (signInError) {
      console.error('Sign in failed:', signInError.message);
      console.log('Note: You may need to provide the correct password');
      return;
    }
    
    console.log('Sign in successful!');
    console.log('Session details:', {
      hasSession: !!signInData.session,
      userId: signInData.user?.id,
      email: signInData.user?.email,
      expiresAt: signInData.session?.expires_at,
      tokenLength: signInData.session?.access_token?.length
    });
    
    if (!signInData.session) {
      console.error('No session returned');
      return;
    }
    
    // Step 2: Test the token with the admin API
    console.log('\n2. Testing API call with fresh token...');
    const response = await fetch('http://localhost:3000/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${signInData.session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('API call successful! Users returned:', data.data?.users?.length);
      console.log('First user:', data.data?.users?.[0]);
    } else {
      const errorText = await response.text();
      console.error('API call failed:', errorText);
    }
    
    // Step 3: Test token refresh
    console.log('\n3. Testing token refresh...');
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    console.log('Refresh result:', {
      success: !refreshError,
      error: refreshError?.message,
      newTokenLength: refreshData.session?.access_token?.length,
      newExpiresAt: refreshData.session?.expires_at
    });
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testAuthFlow();
