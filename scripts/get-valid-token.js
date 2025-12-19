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

async function getValidToken() {
  try {
    // Get the user and create a session
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error getting auth data:', authError);
      return null;
    }
    
    const user = authData.users.find(u => u.email === 'akayetb@gmail.com');
    if (!user) {
      console.error('Test user not found');
      return null;
    }
    
    // Generate a valid JWT token for this user
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
      options: {
        redirectTo: 'http://localhost:3000'
      }
    });
    
    if (error) {
      console.error('Error generating link:', error);
      return null;
    }
    
    console.log('Generated magic link:', data.properties?.link);
    
    // Extract the token from the magic link (this is a simplified approach)
    const urlParams = new URL(data.properties?.link || '').searchParams;
    const token = urlParams.get('token');
    
    if (token) {
      console.log('Generated token length:', token.length);
      return token;
    } else {
      console.log('Could not extract token from magic link');
      return null;
    }
    
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}

getValidToken();
