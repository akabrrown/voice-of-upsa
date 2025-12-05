-- Add missing publication settings, scheduling, and featured article fields
-- Run this migration to fix publication functionality

-- Add publication scheduling fields
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';

-- Add featured article fields
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS featured_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP WITH TIME ZONE;

-- Add display location field for content control
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS display_location VARCHAR(20) DEFAULT 'none' 
CHECK (display_location IN ('homepage', 'category_page', 'both', 'none'));

-- Add publication settings fields
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS auto_publish BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notify_on_publish BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS moderate_comments BOOLEAN DEFAULT FALSE;

-- Add SEO and metadata fields
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS meta_keywords TEXT,
ADD COLUMN IF NOT EXISTS og_image TEXT,
ADD COLUMN IF NOT EXISTS canonical_url TEXT;

-- Add content control fields
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS content_warning BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS age_restriction BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reading_time INTEGER DEFAULT 0; -- in minutes

-- Add category_id if it doesn't exist (for categorization)
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles(is_featured, featured_order) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_articles_scheduled ON articles(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_display_location ON articles(display_location);
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles(category_id);

-- Update existing articles to have default values
UPDATE articles 
SET 
    display_location = 'none',
    allow_comments = true,
    moderate_comments = false,
    is_featured = false,
    featured_order = 0,
    auto_publish = false,
    notify_on_publish = true
WHERE display_location IS NULL OR allow_comments IS NULL;

-- Grant permissions
GRANT ALL ON articles TO postgres;
GRANT ALL ON articles TO authenticated;
GRANT ALL ON articles TO service_role;
GRANT ALL ON articles TO PUBLIC;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'articles' 
    AND column_name IN (
        'scheduled_at', 'timezone', 'is_featured', 'featured_order', 
        'featured_until', 'display_location', 'auto_publish', 
        'notify_on_publish', 'allow_comments', 'moderate_comments',
        'meta_title', 'meta_description', 'meta_keywords', 'og_image',
        'canonical_url', 'content_warning', 'age_restriction',
        'is_premium', 'reading_time', 'category_id'
    )
ORDER BY column_name;
