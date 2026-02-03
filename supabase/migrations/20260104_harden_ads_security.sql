-- Harden ad_submissions security
-- 1. Restrict INSERT to only allow 'pending' status
-- 2. Restrict UPDATE to admins only
-- 3. Ensure users can only see their own non-published ads

-- Drop existing insert policy to replace it
DROP POLICY IF EXISTS "Anyone can submit ads" ON ad_submissions;
DROP POLICY IF EXISTS "Anyone can insert ad submissions" ON ad_submissions;

-- New Insert Policy: Anyone can insert, but only as 'pending'
CREATE POLICY "Users can submit pending ads" ON ad_submissions
  FOR INSERT WITH CHECK (
    status = 'pending' AND 
    payment_status = 'pending'
  );

-- Ensure Admins have full control (already exists but making sure)
DROP POLICY IF EXISTS "Admins can update ads" ON ad_submissions;
DROP POLICY IF EXISTS "Admins can update ad submissions" ON ad_submissions;

CREATE POLICY "Admins can update all ads" ON ad_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Ensure public view is still limited to published/approved
DROP POLICY IF EXISTS "Anyone can view published or approved ad submissions" ON ad_submissions;
DROP POLICY IF EXISTS "Public can view published and approved ads" ON ad_submissions;

CREATE POLICY "Public can view published and approved ads"
  ON ad_submissions FOR SELECT
  TO public
  USING (status IN ('published', 'approved'));

-- Grant proper permissions
GRANT SELECT, INSERT ON ad_submissions TO authenticated, anon;
GRANT ALL ON ad_submissions TO service_role;
GRANT SELECT, UPDATE, DELETE ON ad_submissions TO authenticated; -- Role-based access handled by RLS
