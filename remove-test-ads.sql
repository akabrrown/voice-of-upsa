-- Remove test ads to show only real user ads
-- This will clean up the sample data we inserted for testing

DELETE FROM ad_submissions 
WHERE email IN (
  'test@banner.com',
  'test@sidebar.com', 
  'test@sponsored.com',
  'test@example.com'
);

-- Verify remaining ads (should only be real user ads)
SELECT 
  'Remaining ads after cleanup:' as info,
  ad_type,
  status,
  first_name,
  last_name,
  email,
  ad_title
FROM ad_submissions 
ORDER BY created_at DESC;
