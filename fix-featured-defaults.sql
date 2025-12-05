-- Ensure articles are not automatically set as featured when published
-- This script removes any default values that might auto-assign featured status

-- Remove any default value from is_featured column
ALTER TABLE articles ALTER COLUMN is_featured DROP DEFAULT;

-- Set is_featured to false by default for existing records
UPDATE articles SET is_featured = false WHERE is_featured IS NULL;

-- Add explicit default of false for is_featured
ALTER TABLE articles ALTER COLUMN is_featured SET DEFAULT false;

-- Ensure featured_order has a reasonable default
ALTER TABLE articles ALTER COLUMN featured_order DROP DEFAULT;
ALTER TABLE articles ALTER COLUMN featured_order SET DEFAULT 0;

-- Ensure featured_until is null by default
ALTER TABLE articles ALTER COLUMN featured_until DROP DEFAULT;
ALTER TABLE articles ALTER COLUMN featured_until SET DEFAULT null;

-- Verify the current defaults
SELECT 
    column_name,
    column_default,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'articles' 
    AND column_name IN ('is_featured', 'featured_order', 'featured_until')
ORDER BY column_name;

-- Check how many articles are currently featured
SELECT 
    COUNT(*) as total_articles,
    COUNT(CASE WHEN is_featured = true THEN 1 END) as featured_articles,
    COUNT(CASE WHEN is_featured = false THEN 1 END) as not_featured_articles,
    COUNT(CASE WHEN is_featured IS NULL THEN 1 END) as null_featured_articles
FROM articles;

-- Show any articles that might have been auto-featured
SELECT 
    id,
    title,
    status,
    is_featured,
    featured_order,
    featured_until,
    published_at,
    created_at
FROM articles 
WHERE is_featured = true 
ORDER BY published_at DESC 
LIMIT 10;
