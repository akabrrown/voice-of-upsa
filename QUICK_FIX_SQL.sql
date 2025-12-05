-- QUICK FIX: Create admin user profile
-- Copy and paste this entire script into your Supabase SQL Editor

-- Step 1: Temporarily disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 2: Create the admin profile
INSERT INTO users (
  id,
  email,
  name,
  role,
  bio,
  avatar_url,
  website,
  location,
  social_links,
  preferences,
  is_active,
  email_verified,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'be91324e-7189-4b06-8c04-70309f4bf908',
  'admin@voiceofupsa.com',
  'UPSA Admin',
  'admin',
  null,
  null,
  null,
  null,
  '{}',
  '{}',
  true,
  true,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = NOW();

-- Step 3: Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 4: Verify the profile was created
SELECT * FROM users WHERE id = 'be91324e-7189-4b06-8c04-70309f4bf908';
