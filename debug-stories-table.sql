-- Debug script to check anonymous_stories table
-- Run this in Supabase SQL editor

-- Check if table exists
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'anonymous_stories';

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'anonymous_stories'
ORDER BY ordinal_position;

-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'anonymous_stories';

-- Check policies
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'anonymous_stories';

-- Test basic select
SELECT COUNT(*) as story_count FROM anonymous_stories;

-- Test select with condition
SELECT COUNT(*) as approved_count FROM anonymous_stories WHERE status = 'approved';

-- Show sample data
SELECT title, category, status, author_type, created_at 
FROM anonymous_stories 
WHERE status = 'approved' 
ORDER BY created_at DESC;
