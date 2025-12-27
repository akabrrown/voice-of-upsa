-- Database Security Hardening Migration
-- Date: 2025-12-22
-- Description: Revokes anonymous access to sensitive tables and hardens RLS policies.

-- 1. REVOKE ANONYMOUS ACCESS
-- These tables should NEVER be directly accessible by anonymous users via the REST API
REVOKE SELECT ON public.users FROM anon;
REVOKE SELECT ON public.settings FROM anon;
REVOKE ALL ON public.users FROM anon;
REVOKE ALL ON public.settings FROM anon;

-- 2. ENABLE RLS ON CORE TABLES (Ensuring it's on)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- 3. HARDEN USERS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage users" ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;

-- Policy: Users can read their own profile
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
CREATE POLICY "Users can read own data" ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Policy: Admins can read all profiles (using exact role check)
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.users;
CREATE POLICY "Admins can read all profiles" ON public.users
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Admins can manage all users
CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- 4. HARDEN SETTINGS TABLE POLICIES
DROP POLICY IF EXISTS "Allow public read access for settings" ON public.settings;
DROP POLICY IF EXISTS "Allow admin full access for settings" ON public.settings;

-- Policy: Authenticated users can read site settings
-- Note: If public needs settings (like site name), keep it TO anon, 
-- but filter sensitive columns. Here we restrict to authenticated for safety.
DROP POLICY IF EXISTS "Authenticated users can read settings" ON public.settings;
CREATE POLICY "Authenticated users can read settings" ON public.settings
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Admins can manage settings
DROP POLICY IF EXISTS "Admins can manage settings" ON public.settings;
CREATE POLICY "Admins can manage settings" ON public.settings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- 5. RE-VERIFY CATEGORIES (Public Read, Admin Manage)
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories" ON public.categories
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- 6. ENSURE NO OTHER PERMISSIVE GRANTS
-- Reviewing other tables from the audit
REVOKE ALL ON public.contact_messages FROM anon;
GRANT INSERT ON public.contact_messages TO anon; -- Allow submissions

REVOKE ALL ON public.ad_submissions FROM anon;
GRANT INSERT ON public.ad_submissions TO anon; -- Allow submissions

-- Verify everything is locked down to service_role and authenticated
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.settings TO service_role;
