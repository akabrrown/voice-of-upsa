-- Force disable RLS using service role privileges
-- This should work even if RLS is blocking access

-- First, try to disable RLS
ALTER TABLE anonymous_messages DISABLE ROW LEVEL SECURITY;

-- If that doesn't work, try this approach:
-- Set the table owner to a role that can bypass RLS
-- (This might be needed in some Supabase configurations)

-- Test access after disabling RLS
SELECT COUNT(*) as message_count FROM anonymous_messages;

-- If still blocked, try dropping all policies completely
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON anonymous_messages;
DROP POLICY IF EXISTS "Authenticated users can insert responses" ON anonymous_messages;
DROP POLICY IF EXISTS "Admins can insert questions" ON anonymous_messages;
DROP POLICY IF EXISTS "Admins can read all messages" ON anonymous_messages;
DROP POLICY IF EXISTS "Admins can update all messages" ON anonymous_messages;
DROP POLICY IF EXISTS "Admins can delete all messages" ON anonymous_messages;
DROP POLICY IF EXISTS "Approved messages are viewable by everyone" ON anonymous_messages;

-- Test again
SELECT COUNT(*) as message_count FROM anonymous_messages;

-- Show final status
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'anonymous_messages';
