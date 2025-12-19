import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '../../../lib/database-server';

// Type for exec_sql RPC parameters
interface ExecSqlParams {
  sql: string;
}

// Type for exec_sql RPC result
interface ExecSqlResult {
  data?: unknown;
  error?: { message: string } | null;
}

// Temporary endpoint to fix admin role
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const admin = await getSupabaseAdmin();
    
    // Create temporary function that bypasses all triggers and RLS
    const { error: funcError } = await (admin as unknown as { rpc: (name: string, params?: ExecSqlParams) => Promise<ExecSqlResult> })
      .rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION temp_fix_admin_role()
          RETURNS void
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            -- Disable triggers temporarily
            SET session_replication_role = replica;
            
            -- Update the user role directly
            UPDATE users 
            SET role = 'admin', updated_at = NOW() 
            WHERE email = 'akayetb@gmail.com';
            
            -- Re-enable triggers
            SET session_replication_role = DEFAULT;
          END;
          $$;
        `
      });

    if (funcError) {
      console.error('Function creation error:', funcError);
    }

    // Execute the function
    const { error } = await admin.rpc('temp_fix_admin_role');

    if (error) {
      console.error('Function execution error:', error);
      
      // Clean up function
      await (admin as unknown as { rpc: (name: string, params?: ExecSqlParams) => Promise<ExecSqlResult> })
        .rpc('exec_sql', { 
          sql: 'DROP FUNCTION IF EXISTS temp_fix_admin_role()' 
        });
      
      return res.status(500).json({ 
        error: 'Failed to execute admin role fix',
        details: error.message 
      });
    }

    // Clean up function
    await (admin as unknown as { rpc: (name: string, params?: ExecSqlParams) => Promise<ExecSqlResult> })
      .rpc('exec_sql', { 
        sql: 'DROP FUNCTION IF EXISTS temp_fix_admin_role()' 
      });

    // Verify the fix
    const { data: verifyData, error: verifyError } = await admin
      .from('users')
      .select('id, email, name, role, updated_at')
      .eq('email', 'akayetb@gmail.com')
      .single();

    if (verifyError) {
      console.error('Verification error:', verifyError);
      return res.status(500).json({ error: 'Failed to verify role update' });
    }

    return res.json({ 
      success: true, 
      message: 'Admin role fixed successfully',
      user: verifyData 
    });

  } catch (error) {
    console.error('Fix admin role error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
