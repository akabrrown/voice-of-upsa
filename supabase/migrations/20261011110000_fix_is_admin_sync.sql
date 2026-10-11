-- Migration: 20261011110000_fix_is_admin_sync.sql
-- Description: Unifies public.is_admin() logic to honor role = 'admin' and backfills is_admin boolean.

-- 1. Redefine public.is_admin() function to check both is_admin flag and role columns
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_admin = true OR role IN ('admin', 'developer'))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Backfill is_admin column for all existing admin and developer profiles
UPDATE public.profiles
SET is_admin = true
WHERE role IN ('admin', 'developer') AND (is_admin IS NULL OR is_admin = false);
