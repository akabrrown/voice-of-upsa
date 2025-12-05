-- Add contributor_name column to articles table
-- This script adds the contributor_name field to track article contributors

-- Check if column exists before adding
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'contributor_name'
    ) THEN
        ALTER TABLE articles ADD COLUMN contributor_name VARCHAR(255);
        
        RAISE NOTICE 'contributor_name column added to articles table';
    ELSE
        RAISE NOTICE 'contributor_name column already exists in articles table';
    END IF;
END $$;

-- Add comment to describe the column
COMMENT ON COLUMN articles.contributor_name IS 'Name of the contributor who helped create the article (optional)';

-- Update existing articles to have empty contributor_name if needed
UPDATE articles 
SET contributor_name = '' 
WHERE contributor_name IS NULL;

-- Alter column to NOT NULL with default empty string
ALTER TABLE articles ALTER COLUMN contributor_name SET NOT NULL;
ALTER TABLE articles ALTER COLUMN contributor_name SET DEFAULT '';

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'articles' 
AND column_name = 'contributor_name';

SELECT 'contributor_name column setup completed successfully' as status;
