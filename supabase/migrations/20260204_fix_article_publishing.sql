-- Migration: Fix Article Publishing Schema Inconsistency
-- Description: Adds is_published column and sync trigger to keep published status consistent

-- 1. Add is_published column if missing
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'is_published') THEN
    ALTER TABLE articles ADD COLUMN is_published BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 2. Ensure both boolean columns (published, is_published) are NOT NULL with defaults
ALTER TABLE articles ALTER COLUMN published SET DEFAULT false;
ALTER TABLE articles ALTER COLUMN is_published SET DEFAULT false;

-- 3. Synchronize existing data
UPDATE articles 
SET 
  is_published = (status = 'published'),
  published = (status = 'published');

-- 4. Create or replace the synchronization function
CREATE OR REPLACE FUNCTION sync_article_published_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' THEN
    NEW.published := true;
    NEW.is_published := true;
    -- Set published_at if it's null and we are publishing
    IF NEW.published_at IS NULL THEN
      NEW.published_at := NOW();
    END IF;
  ELSE
    NEW.published := false;
    NEW.is_published := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create the trigger
DROP TRIGGER IF EXISTS trg_sync_article_published_status ON articles;
CREATE TRIGGER trg_sync_article_published_status
BEFORE INSERT OR UPDATE OF status, published_at ON articles
FOR EACH ROW
EXECUTE FUNCTION sync_article_published_status();

-- 6. Add integrity constraints
-- First remove any conflicting legacy constraints if they exist (to be safe)
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_is_published_check;

-- Add checking constraint
ALTER TABLE articles ADD CONSTRAINT articles_is_published_check 
CHECK (is_published IS NOT NULL AND is_published IN (true, false));
