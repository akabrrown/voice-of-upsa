// Test endpoint for admin users - now secured
import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '../../../../lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity } from '@/lib/security/cms-security';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = await getSupabaseAdmin();
    if (!supabase) {
      throw new Error('Database connection failed');
    }
    
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('TEST ADMIN USERS API: Database error:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Secured test endpoint',
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

export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'admin:debug',
  auditAction: 'debug_users_tested'
}));
