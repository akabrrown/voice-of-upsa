const fetch = require('node-fetch');

async function testPublicSettings() {
  console.log('Testing /api/public/settings...');
  try {
    const response = await fetch('http://localhost:3000/api/public/settings');
    if (!response.ok) {
      console.error('API responded with status:', response.status);
      return;
    }
    const data = await response.json();
    console.log('Public Settings Data:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data?.settings?.site_logo) {
      console.log('Success: site_logo is present and is:', data.data.settings.site_logo);
    } else {
      console.log('Failure: site_logo is missing or invalid.');
    }
  } catch (error) {
    console.error('Error fetching public settings:', error.message);
  }
}

testPublicSettings();
