-- Remove specified categories from the site
-- This will:
-- 1. Update any articles that reference these categories to set category_id to NULL
-- 2. Delete the categories from the categories table
-- 3. Handle any foreign key constraints properly

-- First, update articles that reference these categories to remove the category reference
-- This prevents foreign key constraint violations
UPDATE articles 
SET category_id = NULL 
WHERE category_id IN (
    SELECT id FROM categories 
    WHERE name IN ('Alumni', 'Faculty', 'Culture', 'Events', 'Research')
);

-- Now delete the categories
DELETE FROM categories 
WHERE name IN ('Alumni', 'Faculty', 'Culture', 'Events', 'Research');

-- Verify the categories have been removed
SELECT 
    'Categories Remaining' as status,
    COUNT(*) as count,
    array_agg(name ORDER BY name) as remaining_categories
FROM categories;

-- Verify articles have been updated (show any articles that had their categories removed)
SELECT 
    'Articles Updated' as status,
    COUNT(*) as count,
    'Had their category references removed and set to NULL' as action
FROM articles 
WHERE category_id IS NULL 
AND title IS NOT NULL;

-- Show current categories for reference
SELECT 
    'Current Categories' as info,
    id,
    name,
    slug,
    description
FROM categories 
ORDER BY name;

-- Note: If you have any other tables that reference these categories,
-- you may need to add additional UPDATE statements here.
-- Common tables that might reference categories:
-- - articles (handled above)
-- - Any other custom tables with category foreign keys
