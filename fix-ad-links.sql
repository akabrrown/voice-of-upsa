-- Add website URLs to ads that don't have them
UPDATE ad_submissions 
SET website = 'https://example.com'
WHERE status = 'published' 
AND (website IS NULL OR website = '');

-- Verify the fix
SELECT 
  ad_title,
  website,
  'Updated with example URL' as status
FROM ad_submissions 
WHERE status = 'published'
AND website = 'https://example.com';
