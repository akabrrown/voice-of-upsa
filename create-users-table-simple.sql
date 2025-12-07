-- Create a simple users table for admin authentication
-- This will allow the admin ads page to work properly

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'editor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for simplicity
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Insert admin user (use your email)
INSERT INTO users (email, role) 
VALUES ('admin@example.com', 'admin')
ON CONFLICT (email) DO UPDATE SET role = 'admin';

-- Also add any other admin emails you might use
INSERT INTO users (email, role) 
VALUES ('your-email@example.com', 'admin')
ON CONFLICT (email) DO UPDATE SET role = 'admin';

-- Verify the table
SELECT 
  'Users table created' as status,
  COUNT(*) as admin_count
FROM users 
WHERE role = 'admin';

-- Show all users
SELECT 
  email,
  role,
  created_at
FROM users 
ORDER BY created_at DESC;
