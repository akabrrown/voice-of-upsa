-- Add category_id to articles table
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles(category_id);

-- Update existing articles to have a default category (optional)
-- This sets all existing articles to have no category (NULL)
-- You can update this later to assign default categories

-- Grant permissions
GRANT ALL ON articles TO postgres;
GRANT ALL ON articles TO authenticated;
GRANT ALL ON articles TO service_role;
GRANT ALL ON articles TO PUBLIC;
