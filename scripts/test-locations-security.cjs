const fetch = require('node-fetch');
      require('dotenv').config();

async function testLocationsSecurity() {
  console.log('--- Testing Ad Locations API Security ---');
  
  const siteUrl = 'http://127.0.0.1:3000';
  
  const url = `${siteUrl}/api/admin/ad-locations`;
  console.log(`Attempting to access ${url} without a token...`);
  
  try {
    const response = await fetch(url, { redirect: 'manual' });
    console.log('Response Status:', response.status);
    console.log('Response Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
    
    const text = await response.text();
    console.log('Response Body (first 100 chars):', text.substring(0, 100));
    
    if (response.status === 401 || response.status === 403) {
      console.log('✅ SUCCESS: API correctly rejected unauthenticated request.');
    } else {
      console.log('❌ FAILED: API allowed unauthenticated request or returned unexpected status.');
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testLocationsSecurity();
