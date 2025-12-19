// Test script to directly call the admin users API endpoint
// This will help us identify if the issue is with authentication or the API itself

const testAdminUsersAPI = async () => {
  try {
    console.log('=== TESTING ADMIN USERS API DIRECTLY ===');
    
    // First, let's try to call the API without authentication to see the error
    console.log('\n1. Testing API without authentication...');
    const responseNoAuth = await fetch('http://localhost:3000/api/admin/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('No auth response status:', responseNoAuth.status);
    const noAuthText = await responseNoAuth.text();
    console.log('No auth response:', noAuthText);
    
    // Now let's check if we can get a valid session from the browser
    console.log('\n2. Checking for existing session...');
    
    // Try to get the session from Supabase client (this would run in browser context)
    console.log('Note: This test needs to be run in browser console to get actual session');
    console.log('Run this in browser console on the admin users page:');
    console.log(`
      // Copy and paste this in browser console:
      (async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          console.log('Session:', session);
          console.log('Error:', error);
          
          if (session) {
            console.log('Making API call with valid token...');
            const response = await fetch('/api/admin/users', {
              headers: {
                'Authorization': \`Bearer \${session.access_token}\`
              }
            });
            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);
          }
        } catch (err) {
          console.error('Error:', err);
        }
      })();
    `);
    
  } catch (error) {
    console.error('Test error:', error);
  }
};

testAdminUsersAPI();
