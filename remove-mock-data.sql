-- Remove all mock/test data from ad_submissions table
-- This will only keep real user-submitted ads

-- Delete test ads with common test email patterns
DELETE FROM ad_submissions 
WHERE email IN (
  'test@banner.com',
  'test@sidebar.com', 
  'test@sponsored.com',
  'test@example.com',
  'admin@example.com',
  'your-email@example.com',
  'john@company.com',
  'jane@marketing.com',
  'mike@education.com',
  'sarah@local.com',
  'david@service.com',
  'emma@creative.com'
);

-- Delete ads with test company names
DELETE FROM ad_submissions 
WHERE company IN (
  'Test Company',
  'Tech Solutions',
  'Marketing Pro',
  'EduPlus',
  'Local Store',
  'Professional Services',
  'Creative Agency'
);

-- Delete ads with test titles
DELETE FROM ad_submissions 
WHERE ad_title IN (
  'Sample Banner Ad',
  'Test Banner Ad',
  'Test Sidebar Ad',
  'Sample Sidebar Ad',
  'Test Sponsored Content',
  'Sample Sponsored Content',
  'Amazing Tech Product',
  'Grow Your Business',
  'Learn New Skills',
  'Weekend Special Sale',
  'Expert Consulting Available',
  'Creative Design Solutions'
);

-- Show remaining ads (should only be real user ads)
SELECT 
  'Remaining real ads:' as info,
  COUNT(*) as count
FROM ad_submissions;

-- Show details of remaining ads
SELECT 
  'Real ad details:' as info,
  ad_title,
  ad_type,
  company,
  email,
  status,
  created_at
FROM ad_submissions 
ORDER BY created_at DESC;
