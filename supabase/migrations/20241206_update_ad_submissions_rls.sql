-- Update RLS policies for ad_submissions table
-- This migration fixes permission issues by:
-- 1. Allowing anyone to view published ads
-- 2. Checking admin role from the users table instead of raw_user_meta_data

-- First, drop existing policies that may be causing issues
DROP POLICY IF EXISTS "Users can view own ad submissions" ON ad_submissions;
DROP POLICY IF EXISTS "Admins can view all ad submissions" ON ad_submissions;
DROP POLICY IF EXISTS "Anyone can insert ad submissions" ON ad_submissions;
DROP POLICY IF EXISTS "Admins can update ad submissions" ON ad_submissions;
DROP POLICY IF EXISTS "Admins can delete ad submissions" ON ad_submissions;

-- Policy: Anyone can view published ad submissions (for public display)
CREATE POLICY "Anyone can view published ad submissions" ON ad_submissions
  FOR SELECT USING (status = 'published');

-- Policy: Users can view their own submissions (any status)
CREATE POLICY "Users can view own ad submissions" ON ad_submissions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Policy: Admins can view all submissions (check role from users table)
CREATE POLICY "Admins can view all ad submissions" ON ad_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy: Anyone can insert submissions (for the form submission)
CREATE POLICY "Anyone can insert ad submissions" ON ad_submissions
  FOR INSERT WITH CHECK (true);

-- Policy: Admins can update submissions (check role from users table)
CREATE POLICY "Admins can update ad submissions" ON ad_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy: Admins can delete submissions (check role from users table)
CREATE POLICY "Admins can delete ad submissions" ON ad_submissions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
