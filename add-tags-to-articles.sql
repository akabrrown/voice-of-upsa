-- Add tags column to articles table
DO $$
BEGIN
    -- Check if the articles table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'articles') THEN
        -- Add tags column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'tags') THEN
            ALTER TABLE articles ADD COLUMN tags TEXT[];
            RAISE NOTICE 'Added tags column to articles table';
        ELSE
            RAISE NOTICE 'tags column already exists in articles table';
        END IF;
    ELSE
        RAISE NOTICE 'articles table does not exist';
    END IF;
END $$;

-- Update existing articles to have empty tags array
UPDATE articles 
SET tags = '{}' 
WHERE tags IS NULL;

-- Create index for better performance on tags queries
CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles USING GIN (tags);
