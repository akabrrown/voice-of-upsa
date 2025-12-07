-- Add your email as admin user - replace with your actual email
-- First, let's see what users exist and add admin role

-- Update existing user to admin role (replace with your actual email)
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- If that doesn't work, let's insert a new admin user with all required fields
INSERT INTO users (
  email,
  name,
  role,
  created_at,
  updated_at
) VALUES (
  'admin@voiceofupsa.com',
  'System Admin',
  'admin',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET 
  role = 'admin',
  name = 'System Admin';

-- Check all admin users
SELECT 
  email,
  name,
  role,
  created_at,
  'Admin user' as user_type
FROM users 
WHERE role = 'admin'
ORDER BY created_at DESC;
