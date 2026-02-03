import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity } from '@/lib/security/cms-security';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });
  }

  try {
    const supabaseAdmin = await getSupabaseAdmin();
    if (!supabaseAdmin) {
      throw new Error('Database connection failed');
    }
    
    console.log('=== FIXING MESSAGES TABLE PERMISSIONS ===');
    
    // Test current permissions first
    const { data: testData, error: testError } = await supabaseAdmin
      .from('contact_messages')
      .select('*', { count: 'exact' })
      .limit(1);
    
    if (!testError) {
      return res.status(200).json({
        success: true,
        message: 'Contact messages permissions are already working',
        data: { testResult: testData },
        timestamp: new Date().toISOString()
      });
    }
    
    const sqlCommands = [
      '-- Disable RLS temporarily',
      'ALTER TABLE contact_messages DISABLE ROW LEVEL SECURITY;',
      '',
      '-- Grant permissions',
      'GRANT ALL ON contact_messages TO service_role;',
      'GRANT SELECT ON contact_messages TO authenticated;',
      'GRANT SELECT ON contact_messages TO anon;',
      '',
      '-- Re-enable RLS',
      'ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;',
      '',
      '-- Create admin policy',
      'CREATE POLICY "Admin full access" ON contact_messages FOR SELECT USING (auth.jwt() ->> \'role\' = \'admin\');',
      '',
      '-- Test query',
      'SELECT COUNT(*) FROM contact_messages;'
    ];
    
    const fullSQL = sqlCommands.join('\n');
    
    return res.status(200).json({
      success: true,
      message: 'SQL commands generated for fixing contact messages permissions',
      data: { 
        sqlCommands: fullSQL,
        instructions: 'Run these SQL commands in your Supabase SQL editor to fix the permissions issue.',
        error: testError.message
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Permission fix error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fix permissions',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'admin:setup',
  auditAction: 'messages_permissions_fixed'
}));
