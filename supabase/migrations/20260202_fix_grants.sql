-- Migration: Fix Schema and Table Grants
-- Date: 2026-02-02

-- 1. Ensure usage on necessary schemas
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA auth TO anon, authenticated;

-- 2. Ensure basic table grants for RLS to work
-- (RLS still restricts the actual rows)
GRANT SELECT ON public.users TO anon, authenticated;
GRANT SELECT ON public.articles TO anon, authenticated;
GRANT SELECT ON public.settings TO anon, authenticated;

-- 3. Ensure routine grants
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_editor(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO anon, authenticated;

-- 4. Special cases for auth schema functions used in policies
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.role() TO anon, authenticated;
