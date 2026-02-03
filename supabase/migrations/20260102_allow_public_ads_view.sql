-- Allow public access to published and approved ads in ad_submissions table

-- 1. Grant permissions to roles (Critical step often missed)
GRANT SELECT ON ad_submissions TO anon, authenticated, service_role;

-- 2. Ensure RLS is enabled
ALTER TABLE ad_submissions ENABLE ROW LEVEL SECURITY;

-- 3. Create or replace the policy
-- We drop it first to ensure we can redefine it if needed without errors
DROP POLICY IF EXISTS "Public can view published and approved ads" ON ad_submissions;

CREATE POLICY "Public can view published and approved ads"
ON ad_submissions
FOR SELECT
TO public
USING (status IN ('published', 'approved'));
