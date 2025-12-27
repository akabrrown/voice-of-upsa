-- Fix Infinite Recursion in Users Table RLS Policies
-- Date: 2025-12-22
-- Description: Fixes infinite recursion by using a function that bypasses RLS

-- Create a security definer function that bypasses RLS to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id
    AND role = 'admin'
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- Drop the problematic recursive policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage settings" ON public.settings;

-- Recreate policies using the non-recursive function
CREATE POLICY "Admins can read all profiles" ON public.users
    FOR SELECT
    TO authenticated
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage settings" ON public.settings
    FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()));
