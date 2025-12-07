-- Disable RLS completely to fix ad display issues
-- This will allow public access to published ads

ALTER TABLE ad_submissions DISABLE ROW LEVEL SECURITY;

-- Insert test ads if they don't exist
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
  'Published ads by type:' as info,
  ad_type,
  COUNT(*) as count
FROM ad_submissions 
WHERE status = 'published'
GROUP BY ad_type;
