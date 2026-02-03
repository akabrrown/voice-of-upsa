-- Grant permissions for team_members table

-- Grant full access to Postgres admin and Service Role
GRANT ALL ON TABLE public.team_members TO postgres;
GRANT ALL ON TABLE public.team_members TO service_role;

-- Grant permissions to authenticated users (RLS will filter what they can actually do)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.team_members TO authenticated;

-- Grant read-only access to anonymous users (for the public website)
GRANT SELECT ON TABLE public.team_members TO anon;

-- Ensure sequence permissions if ID is auto-generated (though it is UUID default gen_random_uuid so no sequence usually, but good practice)
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;
