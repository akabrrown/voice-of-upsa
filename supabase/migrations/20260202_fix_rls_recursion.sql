-- Migration: Final RLS Fix (Recursion & Permissions)
-- Date: 2026-02-02

-- 1. Restore/Fix security definer helpers
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

-- Grant execution to everyone (so policies can evaluate)
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_editor(uuid) TO authenticated, anon, service_role;

-- 2. Restore exec diagnostic function
CREATE OR REPLACE FUNCTION public.exec(sql text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE 'SELECT row_to_json(t) FROM (' || sql || ') t';
END;
$$;
REVOKE ALL ON FUNCTION public.exec(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.exec(text) TO service_role;


-- 3. Fix USERS table policies
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own data" ON public.users
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- Policy: Admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON public.users
    FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()));

-- Policy: Admins can manage all users
CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()));

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;


-- 4. Fix ARTICLES table policies
ALTER TABLE public.articles DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "articles_select_policy" ON public.articles;
DROP POLICY IF EXISTS "articles_insert_policy" ON public.articles;
DROP POLICY IF EXISTS "articles_update_policy" ON public.articles;
DROP POLICY IF EXISTS "articles_delete_policy" ON public.articles;

-- Policy: SELECT - Published are public, drafts for staff/author
CREATE POLICY "articles_select_policy" ON public.articles
FOR SELECT TO authenticated, anon
USING (
  status = 'published' OR
  public.is_editor(auth.uid()) OR
  author_id = auth.uid()
);

-- Policy: INSERT - Staff only
CREATE POLICY "articles_insert_policy" ON public.articles
FOR INSERT TO authenticated
WITH CHECK (
  public.is_editor(auth.uid())
);

-- Policy: UPDATE - Staff or author
CREATE POLICY "articles_update_policy" ON public.articles
FOR UPDATE TO authenticated
USING (
  public.is_editor(auth.uid()) OR
  author_id = auth.uid()
);

-- Policy: DELETE - Admin only
CREATE POLICY "articles_delete_policy" ON public.articles
FOR DELETE TO authenticated
USING (
  public.is_admin(auth.uid())
);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;


-- 5. Fix SETTINGS table policies
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage settings" ON public.settings;
DROP POLICY IF EXISTS "Authenticated users can read settings" ON public.settings;
DROP POLICY IF EXISTS "Everyone can read settings" ON public.settings;

CREATE POLICY "Admins can manage settings" ON public.settings
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Everyone can read settings" ON public.settings
  FOR SELECT TO authenticated, anon
  USING (true);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
