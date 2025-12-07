-- Check the website URLs for published ads
-- This will help identify if ads have valid linkUrl values

SELECT 
  id,
  ad_title,
  ad_type,
  status,
  website,
  CASE 
    WHEN website IS NULL OR website = '' THEN 'MISSING LINK'
    WHEN website NOT LIKE 'http%' THEN 'INVALID FORMAT'
    ELSE 'VALID'
  END as link_status,
  created_at
FROM ad_submissions 
WHERE status = 'published'
ORDER BY ad_type, created_at DESC;

-- Also show a few sample ads with all their data
SELECT 
  'Sample ad data:' as info,
  ad_title,
  website,
  ad_description,
  company
FROM ad_submissions 
WHERE status = 'published'
LIMIT 3;
