-- Check featured images for published articles
-- This will help identify if articles have proper featured images

SELECT 
  'Published articles with featured images:' as info,
  id,
  title,
  slug,
  featured_image,
  CASE 
    WHEN featured_image IS NULL OR featured_image = '' THEN 'MISSING IMAGE'
    WHEN featured_image LIKE 'http%' THEN 'FULL URL'
    ELSE 'RELATIVE PATH'
  END as image_status,
  status,
  created_at
FROM articles 
WHERE status = 'published'
ORDER BY created_at DESC;

-- Show sample articles without featured images
SELECT 
  'Articles missing featured images:' as info,
  title,
  slug,
  status
FROM articles 
WHERE status = 'published'
AND (featured_image IS NULL OR featured_image = '')
ORDER BY created_at DESC;
