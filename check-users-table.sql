-- Check the existing users table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Show existing users
SELECT 
  id,
  email,
  name,
  role,
  created_at
FROM users 
ORDER BY created_at DESC
LIMIT 5;
