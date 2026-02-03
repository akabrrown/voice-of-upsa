-- Fix permission denied for table ad_submissions
-- This migration ensures that the public roles have SELECT access to published ads.

-- 1. Grant base permissions - Critical for 42501 errors
GRANT SELECT ON public.ad_submissions TO anon;
GRANT SELECT ON public.ad_submissions TO authenticated;
GRANT ALL ON public.ad_submissions TO service_role;

-- 2. Ensure RLS is active
ALTER TABLE public.ad_submissions ENABLE ROW LEVEL SECURITY;

-- 3. Re-enforce the public view policy
DROP POLICY IF EXISTS "Public can view published and approved ads" ON public.ad_submissions;
CREATE POLICY "Public can view published and approved ads"
ON public.ad_submissions
FOR SELECT
TO public
USING (status IN ('published', 'approved'));

-- 4. Verify that schema usage is allowed (usually granted by default, but safe to ensure)
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
