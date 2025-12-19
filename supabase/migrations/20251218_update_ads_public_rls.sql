-- Allow anyone to view published OR approved ads
DROP POLICY IF EXISTS "Anyone can view published ad submissions" ON ad_submissions;

CREATE POLICY "Anyone can view published or approved ad submissions" ON ad_submissions
  FOR SELECT USING (status IN ('published', 'approved'));
