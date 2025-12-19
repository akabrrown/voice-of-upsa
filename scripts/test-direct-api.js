// Test script to bypass authentication and test the admin users API directly
// This will help identify if the issue is with authentication or the API logic

const testDirectAPI = async () => {
  try {
    console.log('=== TESTING ADMIN USERS API WITHOUT AUTH ===');
    
    // Test 1: Call API without auth to see the error
    console.log('\n1. Testing API without authentication:');
    const response1 = await fetch('http://localhost:3000/api/admin/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response1.status);
    const text1 = await response1.text();
    console.log('Response body:', text1);
    
    // Test 2: Check if the API endpoint exists by calling with a dummy token
    console.log('\n2. Testing API with dummy token:');
    const response2 = await fetch('http://localhost:3000/api/admin/users', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer dummy_token_12345',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response2.status);
    const text2 = await response2.text();
    console.log('Response body:', text2);
    
    // Test 3: Check if the development server is running
    console.log('\n3. Testing development server health:');
    try {
      const response3 = await fetch('http://localhost:3000/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Health check status:', response3.status);
      if (response3.ok) {
        const healthData = await response3.json();
        console.log('Health check response:', healthData);
      } else {
        console.log('Health check failed, server might not be running properly');
      }
    } catch (error) {
      console.log('Health check failed - server might not be running:', error.message);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
};

// Test the API directly
testDirectAPI();
