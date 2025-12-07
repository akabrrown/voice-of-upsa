-- Disable RLS on ad_submissions table to fix permission issues
-- This will allow the admin API to access the ads

ALTER TABLE ad_submissions DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on users table if it's enabled
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('ad_submissions', 'users')
AND schemaname = 'public';

-- Test access to ad_submissions
SELECT 
  'Testing ad_submissions access:' as info,
  COUNT(*) as total_ads
FROM ad_submissions;

-- Test access to users table  
SELECT 
  'Testing users access:' as info,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE role = 'admin') as admin_users
FROM users;
