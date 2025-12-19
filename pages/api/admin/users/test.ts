// Test endpoint for admin users without authentication
// This will help verify if the API logic is working correctly

import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '../../../../lib/database-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('TEST ADMIN USERS API: Called without authentication');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('TEST ADMIN USERS API: Getting Supabase admin client...');
    const supabase = await getSupabaseAdmin();
    
    console.log('TEST ADMIN USERS API: Querying users table...');
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('TEST ADMIN USERS API: Database error:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }
    
    console.log('TEST ADMIN USERS API: Users found:', users?.length || 0);
    
    return res.status(200).json({
      success: true,
      message: 'Test endpoint - no authentication required',
      data: {
        users: users || [],
        count: users?.length || 0
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('TEST ADMIN USERS API: Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
