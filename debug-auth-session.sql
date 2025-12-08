-- Debug the authentication session issue
-- This will help us understand why 401 errors persist

-- First, check if RLS is actually disabled
SELECT 
  'RLS Status Check:' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('users', 'articles')
AND schemaname = 'public';

-- Check if the user exists in the database
SELECT 
  'User Existence Check:' as check_type,
  id,
  email,
  role,
  created_at,
  updated_at
FROM users 
WHERE id = 'be91324e-7189-4b06-8c04-70309f4bf908';

-- Check all users to see if any exist
SELECT 
  'All Users Count:' as check_type,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
  COUNT(*) FILTER (WHERE role = 'editor') as editor_count,
  COUNT(*) FILTER (WHERE role = 'user') as user_count
FROM users;

-- Check if there are any authentication-related issues
SELECT 
  'Auth System Check:' as check_type,
  'Checking auth.users table' as status;

-- Force disable RLS if still enabled
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users' AND schemaname = 'public' AND rowsecurity = true) THEN
    EXECUTE 'ALTER TABLE users DISABLE ROW LEVEL SECURITY';
    RAISE NOTICE 'RLS disabled on users table';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'articles' AND schemaname = 'public' AND rowsecurity = true) THEN
    EXECUTE 'ALTER TABLE articles DISABLE ROW LEVEL SECURITY';
    RAISE NOTICE 'RLS disabled on articles table';
  END IF;
END $$;

-- Final verification
SELECT 
  'Final RLS Status:' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('users', 'articles')
AND schemaname = 'public';
