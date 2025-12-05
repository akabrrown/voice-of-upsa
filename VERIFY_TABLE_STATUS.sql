-- =====================================================
-- VERIFY WHAT ACTUALLY EXISTS IN DATABASE
-- =====================================================

-- Check if site_settings table exists
SELECT 'Table existence check' as test_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.tables 
         WHERE table_name = 'site_settings'
       ) THEN 'EXISTS' ELSE 'MISSING' END as result;

-- Check RLS status
SELECT 'RLS status check' as test_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_tables 
         WHERE tablename = 'site_settings' AND rowsecurity = true
       ) THEN 'ENABLED' ELSE 'DISABLED' END as result;

-- Check table data
SELECT 'Table data check' as test_name,
       COUNT(*) as row_count,
       MIN(id) as sample_id
FROM site_settings;

-- Show actual table structure
SELECT 'Table structure' as test_name,
       column_name,
       data_type,
       is_nullable,
       column_default
FROM information_schema.columns
WHERE table_name = 'site_settings'
ORDER BY ordinal_position;

-- Show sample data
SELECT 'Sample data' as test_name,
       id,
       site_name,
       site_url,
       created_at
FROM site_settings
LIMIT 5;

-- Check if we can select from it (this will show the actual error)
SELECT 'Direct select test' as test_name,
       *
FROM site_settings
WHERE id = 'default';

-- Check current user and role
SELECT 'Current session info' as test_name,
       current_user as session_user,
       session_user as user_role;
