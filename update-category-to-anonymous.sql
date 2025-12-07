-- Handle existing Anonymous category and update Student Life category
-- Run this script to update existing database entries

-- First, delete any existing Anonymous category to avoid conflicts
DELETE FROM categories WHERE name = 'Anonymous' OR slug = 'anonymous';

-- Now update the Student Life category to Anonymous
UPDATE categories 
SET 
    name = 'Anonymous',
    slug = 'anonymous', 
    description = 'Anonymous messages and questions'
WHERE name = 'Student Life' OR slug = 'student-life';

-- Update any articles that reference the old category (using category_id)
UPDATE articles 
SET category_id = (SELECT id FROM categories WHERE slug = 'anonymous')
WHERE category_id = (SELECT id FROM categories WHERE slug = 'student-life');

-- Verify the changes
SELECT 'Categories updated successfully' as status,
       COUNT(*) as updated_rows
FROM categories 
WHERE name = 'Anonymous' AND slug = 'anonymous';

-- Show the updated category
SELECT * FROM categories WHERE name = 'Anonymous' OR slug = 'anonymous';
