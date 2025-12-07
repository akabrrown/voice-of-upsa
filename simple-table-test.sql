-- Simple test to verify table exists and has data
-- Run this after creating the table

-- Check if table exists
SELECT 
  'Table exists check:' as info,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'ad_submissions';

-- Check if table has data
SELECT 
  'Data count check:' as info,
  COUNT(*) as total_ads
FROM ad_submissions;

-- Show sample data
SELECT 
  'Sample ads:' as info,
  ad_title,
  ad_type,
  status,
  website
FROM ad_submissions 
WHERE status = 'published'
ORDER BY ad_type
LIMIT 5;

-- Check RLS status
SELECT 
  'RLS status:' as info,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'ad_submissions'
AND schemaname = 'public';
