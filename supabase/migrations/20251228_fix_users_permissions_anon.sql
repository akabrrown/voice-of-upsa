-- Give access to anon users to read the users table
-- This is required because 'team_members' has a policy that joins with 'users',
-- so anon users need permission to check 'users' even if RLS returns 0 rows for them.

GRANT SELECT ON TABLE public.users TO anon;

-- SAFETY: Ensure RLS is enabled on users so anon can't actually see data
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Ensure there is a policy for users if one doesn't exist (optional, but good practice)
-- usually "Users can see their own data" is standard. 
-- We won't create it here to avoid conflicts, just ensuring permission is granted.
