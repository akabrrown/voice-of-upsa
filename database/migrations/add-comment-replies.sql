-- Migration: Add comment replies support
-- Description: Add parent_id to enable threaded comment replies

-- Add parent_id column to comments table
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;

-- Create index for efficient reply queries
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- Add index for article_id + parent_id combination (for fetching top-level comments)
CREATE INDEX IF NOT EXISTS idx_comments_article_parent ON comments(article_id, parent_id);

-- Update RLS policies if needed (assuming existing policies cover this)
-- The existing SELECT policy should allow reading replies
-- The existing INSERT policy should allow creating replies

COMMENT ON COLUMN comments.parent_id IS 'ID of the parent comment for threaded replies. NULL for top-level comments.';
