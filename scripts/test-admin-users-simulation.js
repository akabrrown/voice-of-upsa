import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env file
config({ path: '.env.local' });

// Create Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testAdminUsersAPISimulation() {
  try {
    console.log('=== SIMULATING ADMIN USERS API CALL ===');
    
    // Get a valid auth token for testing
    console.log('\n1. Getting auth token...');
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error getting auth data:', authError);
      return;
    }
    
    const user = authData.users.find(u => u.email === 'akayetb@gmail.com');
    if (!user) {
      console.error('Test user not found');
      return;
    }
    
    console.log('Found test user:', user.email);
    
    // Simulate the exact query the API makes
    console.log('\n2. Simulating API query...');
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .range(0, 19); // First page, 20 items
    
    if (fetchError) {
      console.error('Query error:', fetchError);
      return;
    }
    
    console.log('Query successful! Found', users.length, 'users');
    
    // Simulate the role processing logic
    console.log('\n3. Simulating role processing...');
    const processedUsers = users.map(userRecord => {
      let role = userRecord.role || 'user';
      
      // If role is null or undefined, try to get from user_profiles or auth metadata
      if (!role || role === 'null' || role === null) {
        console.log('Role is null in users table, checking user_profiles...');
        
        // For this test, we'll use the auth metadata directly
        const authUser = authData.users.find(u => u.id === userRecord.id);
        if (authUser?.user_metadata?.role) {
          role = authUser.user_metadata.role;
          console.log('Found role in auth metadata:', role);
        } else {
          role = 'user'; // Default fallback
          console.log('Using default role: user');
        }
      }
      
      return {
        ...userRecord,
        role: role
      };
    });
    
    console.log('Processed users:', processedUsers.length);
    
    // Simulate the final API response structure
    const apiResponse = {
      success: true,
      data: {
        users: processedUsers,
        pagination: {
          currentPage: 1,
          totalPages: Math.ceil(processedUsers.length / 20),
          totalUsers: processedUsers.length,
          hasNextPage: false,
          hasPreviousPage: false
        }
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('\n4. Final API response structure:');
    console.log(JSON.stringify(apiResponse, null, 2));
    
    // Test the frontend data access pattern
    console.log('\n5. Testing frontend data access:');
    console.log('data.data?.users:', apiResponse.data?.users);
    console.log('Length:', apiResponse.data?.users?.length);
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testAdminUsersAPISimulation();
