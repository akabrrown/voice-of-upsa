require('dotenv').config({ path: '.env.migration' });

async function inspect() {
  const res = await fetch(`${process.env.OLD_SUPABASE_URL}/rest/v1/ad_submissions?select=*&limit=1`, {
    headers: { apikey: process.env.OLD_SUPABASE_SERVICE_ROLE_KEY }
  });
  const json = await res.json();
  console.log('Ad submission:', json);
}
inspect();
