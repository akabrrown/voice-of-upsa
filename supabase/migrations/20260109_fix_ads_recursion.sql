-- Fix Infinite Recursion in Ad Locations and Ad Submission Locations
-- Date: 2026-01-09
-- Description: Updates RLS policies to use the non-recursive is_admin() function.

-- Drop old recursive policies for ad_locations
DROP POLICY IF EXISTS "Admins can manage ad locations" ON ad_locations;

-- Recreate using is_admin function
CREATE POLICY "Admins can manage ad locations" ON ad_locations
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

-- Drop old recursive policies for ad_submission_locations
DROP POLICY IF EXISTS "Admins can manage ad submission locations" ON ad_submission_locations;

-- Recreate using is_admin function
CREATE POLICY "Admins can manage ad submission locations" ON ad_submission_locations
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

-- Add public read policies for filtering to work on frontend
DROP POLICY IF EXISTS "Public can view ad locations" ON ad_locations;
CREATE POLICY "Public can view ad locations" ON ad_locations
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Public can view ad submission locations" ON ad_submission_locations;
CREATE POLICY "Public can view ad submission_locations" ON ad_submission_locations
  FOR SELECT TO anon, authenticated
  USING (true);

-- Grant SELECT permissions explicitly
GRANT SELECT ON ad_locations TO anon, authenticated;
GRANT SELECT ON ad_submission_locations TO anon, authenticated;
