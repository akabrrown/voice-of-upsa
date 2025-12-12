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
    // Server-side role check - only admins can check table structure
    await requireAdminOrEditor(req);

    // Check settings table structure
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'settings')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (columnsError) {
      console.error('Error checking settings table structure:', columnsError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'TABLE_CHECK_FAILED',
          message: 'Failed to check settings table structure',
          details: columnsError.message
        },
        timestamp: new Date().toISOString()
      });
    }

    // Generate appropriate RLS policy based on actual table structure
    const keyColumn = columns?.find(col => 
      col.column_name.includes('key') || 
      col.column_name.includes('name') ||
      col.column_name === 'setting_key' ||
      col.column_name === 'name'
    );

    const valueColumn = columns?.find(col => 
      col.column_name.includes('value') ||
      col.column_name.includes('data') ||
      col.column_name === 'setting_value'
    );

    // Generate the correct RLS policy SQL
    let publicPolicySQL = '';
    if (keyColumn) {
      publicPolicySQL = `
-- Policy 3: Public can view non-sensitive settings only
CREATE POLICY "Public can view safe settings" ON settings
  FOR SELECT
  TO authenticated
  USING (
    ${keyColumn.column_name} IN ('site_name', 'site_description', 'contact_email', 'social_links') AND
    auth.uid() IS NOT NULL
  );`;
    } else {
      publicPolicySQL = `
-- Policy 3: Only admins can view settings (no key column found)
CREATE POLICY "Admins only can view settings" ON settings
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE role IN ('admin', 'editor')
    )
  );`;
    }

    // Generate complete RLS SQL
    const completeRLSSQL = `
-- RLS Policies for Settings Table - Auto-generated based on table structure

-- Enable RLS on settings table
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all settings" ON settings;
DROP POLICY IF EXISTS "Admins can update settings" ON settings;
DROP POLICY IF EXISTS "Public can view safe settings" ON settings;

-- Policy 1: Admins can view all settings
CREATE POLICY "Admins can view all settings" ON settings
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE role = 'admin'
    )
  );

-- Policy 2: Admins can update settings
CREATE POLICY "Admins can update settings" ON settings
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE role = 'admin'
    )
  );

${publicPolicySQL}`;

    return res.status(200).json({
      success: true,
      data: {
        tableStructure: columns,
        keyColumn: keyColumn?.column_name,
        valueColumn: valueColumn?.column_name,
        generatedRLS: completeRLSSQL,
        recommendations: [
          keyColumn ? 
            `Use column '${keyColumn.column_name}' for setting keys` : 
            'No suitable key column found - consider adding one',
          valueColumn ? 
            `Use column '${valueColumn.column_name}' for setting values` : 
            'No suitable value column found - consider adding one',
          'Review the generated RLS policy before applying',
          'Test the policy in a development environment first'
        ]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Settings table check error:', error);
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
