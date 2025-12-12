import { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { requireAdminOrEditor } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/database-server';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET method is allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Server-side role check - only admins can debug
    await requireAdminOrEditor(req);

    // Check RLS status on users table
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('tablename', 'users')
      .eq('schemaname', 'public')
      .single();

    // Check existing RLS policies
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('policyname, tablename, permissive, roles, cmd, qual')
      .eq('tablename', 'users')
      .eq('schemaname', 'public');

    // Test a simple query as admin
    const { data: testQuery, error: testError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .limit(1);

    // Check if notification_preferences table exists
    const { data: tableExists, error: tableError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'notification_preferences')
      .eq('table_schema', 'public')
      .single();

    return res.status(200).json({
      success: true,
      data: {
        rlsStatus: {
          enabled: rlsStatus?.rowsecurity || false,
          error: rlsError?.message
        },
        policies: {
          count: policies?.length || 0,
          policies: policies || [],
          error: policiesError?.message
        },
        testQuery: {
          success: !testError,
          data: testQuery,
          error: testError?.message
        },
        notificationTable: {
          exists: !!tableExists,
          error: tableError?.message
        },
        recommendations: [
          !rlsStatus?.rowsecurity ? 'Enable RLS on users table' : 'RLS is enabled',
          !policies?.length ? 'Create RLS policies for users table' : 'RLS policies exist',
          testError ? 'Check users table permissions and RLS policies' : 'Test query successful',
          !tableExists ? 'Create notification_preferences table' : 'Notification table exists'
        ]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

export default withErrorHandler(handler);
