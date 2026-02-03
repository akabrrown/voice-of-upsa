const fetch = require('node-fetch');

async function debugSettings() {
  console.log('--- DEBUGGING SETTINGS ---');
  
  try {
    const response = await fetch('http://localhost:3000/api/public/settings');
    console.log('Public API Status:', response.status);
    
    const data = await response.json();
    console.log('Public API Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('Site Logo:', data.data.settings.site_logo);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugSettings();
