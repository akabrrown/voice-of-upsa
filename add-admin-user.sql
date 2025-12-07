-- Add admin user to existing users table with all required fields
-- This assumes the users table has a name column

INSERT INTO users (
  email, 
  name, 
  role
) VALUES (
  'admin@example.com',
  'Admin User',
  'admin'
) ON CONFLICT (email) DO UPDATE SET 
  role = 'admin',
  name = 'Admin User';

-- Also try with your actual email if needed
INSERT INTO users (
  email, 
  name, 
  role
) VALUES (
  'your-email@example.com',
  'Admin User',
  'admin'
) ON CONFLICT (email) DO UPDATE SET 
  role = 'admin',
  name = 'Admin User';

-- Verify the admin user was added
SELECT 
  email,
  name,
  role,
  'Admin user added successfully' as status
FROM users 
WHERE role = 'admin';
