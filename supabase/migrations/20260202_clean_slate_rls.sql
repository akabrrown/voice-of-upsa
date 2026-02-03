-- Migration: Clean Slate RLS Fix
-- Date: 2026-02-02
-- This migration removes ALL conflicting policies and applies a clean, tested set

-- 1. ARTICLES: Drop ALL existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'articles' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.articles';
    END LOOP;
END $$;

-- 2. Ensure is_editor and is_admin functions exist
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

CREATE OR REPLACE FUNCTION public.is_editor(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id
    AND role IN ('admin', 'editor')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_editor(uuid) TO authenticated, anon;

-- 3. Apply ONLY the correct, non-recursive policies
CREATE POLICY "articles_select_policy" ON public.articles
  FOR SELECT TO authenticated, anon
  USING (
    status = 'published' OR
    is_editor(auth.uid()) OR
    author_id = auth.uid()
  );

CREATE POLICY "articles_insert_policy" ON public.articles
  FOR INSERT TO authenticated
  WITH CHECK (
    is_editor(auth.uid())
  );

CREATE POLICY "articles_update_policy" ON public.articles
  FOR UPDATE TO authenticated
  USING (
    is_editor(auth.uid()) OR
    author_id = auth.uid()
  );

CREATE POLICY "articles_delete_policy" ON public.articles
  FOR DELETE TO authenticated
  USING (
    is_admin(auth.uid())
  );

-- 4. Ensure RLS is enabled
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
