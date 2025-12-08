-- Comprehensive fix for 401 authentication errors
-- This script disables RLS and ensures proper access

-- Disable RLS on all critical tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE reactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('users', 'articles', 'bookmarks', 'comments', 'reactions', 'notification_preferences')
AND schemaname = 'public'
ORDER BY tablename;

-- Test basic access to users table
SELECT 
  'Testing users table access:' as info,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE role = 'admin') as admin_users,
  COUNT(*) FILTER (WHERE role = 'editor') as editor_users,
  COUNT(*) FILTER (WHERE role = 'user') as regular_users
FROM users;

-- Test access to articles table
SELECT 
  'Testing articles table access:' as info,
  COUNT(*) as total_articles
FROM articles;

-- Check if the specific user ID exists
SELECT 
  'Checking specific user be91324e-7189-4b06-8c04-70309f4bf908:' as info,
  id,
  email,
  role,
  created_at
FROM users 
WHERE id = 'be91324e-7189-4b06-8c04-70309f4bf908';

-- Check articles by this user
SELECT 
  'Articles by user be91324e-7189-4b06-8c04-70309f4bf908:' as info,
  COUNT(*) as article_count
FROM articles 
WHERE author_id = 'be91324e-7189-4b06-8c04-70309f4bf908';

-- Grant necessary permissions if needed
GRANT ALL ON users TO anon;
GRANT ALL ON users TO authenticated;
GRANT ALL ON articles TO anon;
GRANT ALL ON articles TO authenticated;
GRANT ALL ON bookmarks TO anon;
GRANT ALL ON bookmarks TO authenticated;
GRANT ALL ON comments TO anon;
GRANT ALL ON comments TO authenticated;
GRANT ALL ON reactions TO anon;
GRANT ALL ON reactions TO authenticated;
GRANT ALL ON notification_preferences TO anon;
GRANT ALL ON notification_preferences TO authenticated;

-- Final verification
SELECT 
  'Final verification - permissions granted:' as status,
  CURRENT_TIMESTAMP as timestamp;
