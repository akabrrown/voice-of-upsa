-- Quick fix: Disable RLS temporarily for anonymous_stories
-- Run this in Supabase SQL editor to fix API access immediately

ALTER TABLE anonymous_stories DISABLE ROW LEVEL SECURITY;

-- Test the API access
SELECT COUNT(*) as story_count FROM anonymous_stories;
SELECT COUNT(*) as approved_count FROM anonymous_stories WHERE status = 'approved';

-- Show sample data to verify
SELECT title, category, status, author_type, created_at 
FROM anonymous_stories 
WHERE status = 'approved' 
ORDER BY created_at DESC;
