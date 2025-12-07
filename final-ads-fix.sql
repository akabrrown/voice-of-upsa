-- Final fix for ad display issues - run this in Supabase SQL editor

-- Drop all existing ad policies to start fresh
DROP POLICY IF EXISTS "Anyone can insert ad submissions" ON ad_submissions;
DROP POLICY IF EXISTS "Users can view own submissions" ON ad_submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON ad_submissions;
DROP POLICY IF EXISTS "Admins can update submissions" ON ad_submissions;
DROP POLICY IF EXISTS "Admins can delete submissions" ON ad_submissions;
DROP POLICY IF EXISTS "Public can read published ads" ON ad_submissions;
DROP POLICY IF EXISTS "Admins full access" ON ad_submissions;

-- Create simple policies that don't depend on users table
-- 1. Allow anyone to submit ads
CREATE POLICY "Allow ad submissions" ON ad_submissions
  FOR INSERT WITH CHECK (true);

-- 2. Allow EVERYONE to read published ads (no user table dependency)
CREATE POLICY "Public read published ads" ON ad_submissions
  FOR SELECT USING (status = 'published');

-- 3. For now, allow all authenticated users to manage ads (simpler admin check)
CREATE POLICY "Authenticated users full access" ON ad_submissions
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert test ads for each type if they don't exist
INSERT INTO ad_submissions (
  first_name, last_name, email, phone, company, business_type, 
  ad_type, ad_title, ad_description, target_audience, budget, 
  duration, start_date, website, terms_accepted, status
) VALUES 
  ('Test', 'Banner', 'test@banner.com', '+233501234567', 'Test Co', 'corporate', 
   'banner', 'Test Banner Ad', 'Sample banner ad for homepage display', 
   'All visitors', 'GHS 500', '1-month', CURRENT_DATE, 'https://example.com', true, 'published'),
  ('Test', 'Sidebar', 'test@sidebar.com', '+233501234567', 'Test Co', 'corporate', 
   'sidebar', 'Test Sidebar Ad', 'Sample sidebar ad for articles page', 
   'Article readers', 'GHS 300', '1-month', CURRENT_DATE, 'https://example.com', true, 'published'),
  ('Test', 'Sponsored', 'test@sponsored.com', '+233501234567', 'Test Co', 'corporate', 
   'sponsored-content', 'Test Sponsored Content', 'Sample sponsored content for homepage', 
   'All visitors', 'GHS 800', '1-month', CURRENT_DATE, 'https://example.com', true, 'published')
ON CONFLICT DO NOTHING;

-- Verify the fix
SELECT 
  ad_type,
  status,
  COUNT(*) as count
FROM ad_submissions 
GROUP BY ad_type, status
ORDER BY ad_type, status;
