-- Debug script to check anonymous_messages table and permissions
-- Run this in Supabase SQL editor

-- Check if table exists
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'anonymous_messages';

-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'anonymous_messages';

-- Check current policies
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'anonymous_messages';

-- Try a simple select to see if we can access the table
SELECT COUNT(*) as message_count FROM anonymous_messages;

-- Disable RLS temporarily to test
ALTER TABLE anonymous_messages DISABLE ROW LEVEL SECURITY;

-- Test again
SELECT COUNT(*) as message_count FROM anonymous_messages;
