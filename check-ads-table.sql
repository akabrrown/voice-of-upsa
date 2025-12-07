-- Check if ad_submissions table exists and show its structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'ad_submissions' 
ORDER BY ordinal_position;

-- Show existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'ad_submissions';

-- Show sample data
SELECT 
  id,
  first_name,
  last_name,
  email,
  ad_type,
  ad_title,
  status,
  created_at
FROM ad_submissions 
LIMIT 5;

-- Count ads by status
SELECT 
  status,
  COUNT(*) as count
FROM ad_submissions 
GROUP BY status
ORDER BY count DESC;
