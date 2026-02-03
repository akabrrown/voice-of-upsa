-- Grant permissions for users table
-- This is needed for RLS policies on other tables (like team_members) that reference public.users
-- and for the CMS security middleware to verify user roles.

-- Grant full access to Postgres admin and Service Role
GRANT ALL ON TABLE public.users TO postgres;
GRANT ALL ON TABLE public.users TO service_role;

-- Grant SELECT permission to authenticated users so they can be verified
GRANT SELECT ON TABLE public.users TO authenticated;

-- Ensure sequence permissions if any (users id is uuid references auth.users so usually no sequence)
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
