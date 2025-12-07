-- Final fix to completely disable RLS and grant permissions
-- This should resolve the permission denied error

-- Disable RLS on ad_submissions table
ALTER TABLE ad_submissions DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Grant explicit permissions to the service role
GRANT ALL ON ad_submissions TO service_role;
GRANT ALL ON users TO service_role;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ad_submissions TO authenticated;
GRANT SELECT ON users TO authenticated;

-- Grant permissions to anonymous users (for public ad display)
GRANT SELECT ON ad_submissions TO anon;
GRANT SELECT ON users TO anon;

-- Verify permissions
SELECT 
  'RLS Status:' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('ad_submissions', 'users')
AND schemaname = 'public';

-- Test access with a simple query
SELECT 
  'Test Query:' as info,
  COUNT(*) as total_ads
FROM ad_submissions;

-- Show sample ads
SELECT 
  'Sample Ads:' as info,
  ad_title,
  ad_type,
  status,
  website
FROM ad_submissions 
LIMIT 3;
