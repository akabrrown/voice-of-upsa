-- Final fix: Completely remove RLS and grant public access
-- Run this in Supabase SQL editor

-- Disable RLS completely
ALTER TABLE anonymous_stories DISABLE ROW LEVEL SECURITY;

-- Also disable for story_reports if it exists
ALTER TABLE story_reports DISABLE ROW LEVEL SECURITY;

-- Grant public access to the table
GRANT ALL ON anonymous_stories TO anon;
GRANT ALL ON anonymous_stories TO authenticated;

-- Grant public access to story_reports
GRANT ALL ON story_reports TO anon;
GRANT ALL ON story_reports TO authenticated;

-- Test access
SELECT COUNT(*) as story_count FROM anonymous_stories;
SELECT COUNT(*) as approved_count FROM anonymous_stories WHERE status = 'approved';

-- Show sample data
SELECT title, category, status, author_type, created_at 
FROM anonymous_stories 
WHERE status = 'approved' 
ORDER BY created_at DESC;
