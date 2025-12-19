import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '../../../lib/database-server';

interface DebugResults {
  userId: string;
  userEmail: string;
  checks: {
    users?: {
      success: boolean;
      data: Record<string, unknown> | null;
      error?: string | undefined;
    };
    user_profiles?: {
      success: boolean;
      data: Record<string, unknown> | null;
      error?: string | undefined;
    };
    auth_users?: {
      success: boolean;
      data: Record<string, unknown> | null;
      error?: string | undefined;
    };
    available_tables?: {
      success: boolean;
      data: { table_name: string }[] | null;
      error?: string | undefined;
    };
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const admin = await getSupabaseAdmin();
    
    // Get the user from the request (this should be called with auth token)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    
    if (authError || !authData?.user) {
      return res.status(401).json({ error: 'Invalid token', authError });
    }

    const user = authData.user;
    console.log('Debug: Checking role for user:', user.id, user.email);

    // Check all possible tables where role might be stored
    const results: DebugResults = {
      userId: user.id,
      userEmail: user.email || '',
      checks: {}
    };

    // Check users table
    try {
      const { data: usersData, error: usersError } = await admin
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      results.checks.users = {
        success: !usersError,
        data: usersData,
        error: usersError?.message
      };
    } catch (e) {
      results.checks.users = {
        success: false,
        data: null,
        error: e instanceof Error ? e.message : 'Unknown error'
      };
    }

    // Check user_profiles table
    try {
      const { data: profilesData, error: profilesError } = await admin
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      results.checks.user_profiles = {
        success: !profilesError,
        data: profilesData,
        error: profilesError?.message
      };
    } catch (e) {
      results.checks.user_profiles = {
        success: false,
        data: null,
        error: e instanceof Error ? e.message : 'Unknown error'
      };
    }

    // Check auth.users metadata
    try {
      const { data: adminAuthData } = await admin.auth.admin.getUserById(user.id);
      results.checks.auth_users = {
        success: true,
        data: {
          email: adminAuthData?.user?.email,
          user_metadata: adminAuthData?.user?.user_metadata,
          app_metadata: adminAuthData?.user?.app_metadata
        }
      };
    } catch (e) {
      results.checks.auth_users = {
        success: false,
        data: null,
        error: e instanceof Error ? e.message : 'Unknown error'
      };
    }

    // List all tables to see what's available
    try {
      const { data: tables } = await admin
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .like('table_name', '%user%');
      
      results.checks.available_tables = {
        success: true,
        data: tables
      };
    } catch (e) {
      results.checks.available_tables = {
        success: false,
        data: null,
        error: e instanceof Error ? e.message : 'Unknown error'
      };
    }

    return res.status(200).json(results);

  } catch (error) {
    console.error('Debug role check error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
