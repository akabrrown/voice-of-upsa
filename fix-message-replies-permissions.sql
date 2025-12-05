-- Fix permissions for message_replies table
-- This script ensures proper RLS policies and permissions are set

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin full access message_replies" ON message_replies;

-- Create proper RLS policy for message_replies
CREATE POLICY "Admin full access message_replies" ON message_replies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Ensure RLS is enabled
ALTER TABLE message_replies ENABLE ROW LEVEL SECURITY;

-- Grant proper permissions
GRANT ALL ON message_replies TO authenticated;
GRANT ALL ON message_replies TO service_role;
-- Note: anon users should not have access to message_replies

-- Also fix contact_submissions permissions to ensure consistency
DROP POLICY IF EXISTS "Admin full access contact_submissions" ON contact_submissions;
CREATE POLICY "Admin full access contact_submissions" ON contact_submissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

GRANT ALL ON contact_submissions TO authenticated;
GRANT ALL ON contact_submissions TO service_role;
GRANT INSERT ON contact_submissions TO anon;

-- Verify the policies are set correctly
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('message_replies', 'contact_submissions');

-- Show table permissions
SELECT 
    table_name,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name IN ('message_replies', 'contact_submissions')
ORDER BY table_name, grantee;

SELECT 'Permissions fixed successfully' as status;
