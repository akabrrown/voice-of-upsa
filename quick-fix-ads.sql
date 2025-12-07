-- Quick fix for ad display issues - run this in Supabase SQL editor

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can insert ad submissions" ON ad_submissions;
DROP POLICY IF EXISTS "Users can view own submissions" ON ad_submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON ad_submissions;
DROP POLICY IF EXISTS "Admins can update submissions" ON ad_submissions;
DROP POLICY IF EXISTS "Admins can delete submissions" ON ad_submissions;
DROP POLICY IF EXISTS "Public can read published ads" ON ad_submissions;
DROP POLICY IF EXISTS "Admins full access" ON ad_submissions;

-- Create simple, effective policies
-- 1. Allow anyone to submit ads (for the ad form)
CREATE POLICY "Allow ad submissions" ON ad_submissions
  FOR INSERT WITH CHECK (true);

-- 2. Allow EVERYONE to read published ads (this is the key fix!)
CREATE POLICY "Public read published ads" ON ad_submissions
  FOR SELECT USING (status = 'published');

-- 3. Allow admins full access
CREATE POLICY "Admin full access" ON ad_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Test the fix by inserting a sample published ad if none exists
INSERT INTO ad_submissions (
  first_name,
  last_name,
  email,
  phone,
  company,
  business_type,
  ad_type,
  ad_title,
  ad_description,
  target_audience,
  budget,
  duration,
  start_date,
  website,
  terms_accepted,
  status
) 
SELECT 
  'Test',
  'Advertiser',
  'test@example.com',
  '+233501234567',
  'Test Company',
  'corporate',
  'banner',
  'Sample Banner Ad',
  'This is a sample banner advertisement for testing purposes.',
  'UPSA students and faculty',
  'GHS 500',
  '1-month',
  CURRENT_DATE,
  'https://example.com',
  true,
  'published'
WHERE NOT EXISTS (
  SELECT 1 FROM ad_submissions WHERE status = 'published' LIMIT 1
);

-- Verify the fix worked
SELECT 
  'Published ads count:' as info,
  COUNT(*) as count
FROM ad_submissions 
WHERE status = 'published';
