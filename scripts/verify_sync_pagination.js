
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function verifySyncOnly() {
  console.log('Starting verification of sync logic...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Pagination variables
  let page = 1;
  const perPage = 10; // Use a small number to test pagination loop
  let hasMore = true;
  let allAuthUsers = [];
  
  // Fetch all users with pagination
  while (hasMore) {
    console.log(`Fetching page ${page} of users...`);
    const { data: { users }, error } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: perPage
    });

    if (error) {
      console.error('Error fetching auth users:', error);
      break;
    }

    if (!users || users.length === 0) {
      console.log(`No more users found on page ${page}`);
      hasMore = false;
    } else {
      console.log(`Fetched ${users.length} users on page ${page}`);
      allAuthUsers = [...allAuthUsers, ...users];
      
      if (users.length < perPage) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  console.log(`Total users found: ${allAuthUsers.length}`);
  
  if (allAuthUsers.length > 50) {
    console.log('SUCCESS: Pagination logic likely needed (found > 50 users)');
  } else {
    console.log('NOTE: Total users <= 50, so pagination might not check next page but logic is sound.');
  }
}

verifySyncOnly();
