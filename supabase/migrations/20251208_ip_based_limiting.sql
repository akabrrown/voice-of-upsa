-- 1. Update anonymous_stories tracking tables
-- Add ip_address to story_views
ALTER TABLE story_views ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Add ip_address to story_likes
ALTER TABLE story_likes ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Update constraints for story_views
-- We want uniqueness on (story_id, ip_address) as well
ALTER TABLE story_views DROP CONSTRAINT IF EXISTS unique_ip_view;
CREATE UNIQUE INDEX IF NOT EXISTS unique_ip_view_idx ON story_views (story_id, ip_address) WHERE ip_address IS NOT NULL;

-- Update constraints for story_likes
ALTER TABLE story_likes DROP CONSTRAINT IF EXISTS unique_ip_like;
CREATE UNIQUE INDEX IF NOT EXISTS unique_ip_like_idx ON story_likes (story_id, ip_address) WHERE ip_address IS NOT NULL;


-- 2. Create article_views table (New)
CREATE TABLE IF NOT EXISTS article_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for unique views
CREATE UNIQUE INDEX IF NOT EXISTS unique_article_user_view ON article_views (article_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS unique_article_ip_view ON article_views (article_id, ip_address) WHERE ip_address IS NOT NULL;

-- Enable RLS
ALTER TABLE article_views ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE article_views TO service_role;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'article_views' 
        AND policyname = 'Service role full access on article_views'
    ) THEN
        CREATE POLICY "Service role full access on article_views" ON article_views FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;


-- 3. Update reactions table (for Article Likes/Reactions)
-- Add ip_address
ALTER TABLE reactions ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Update constraints: Ensure unique reaction per IP per article (for anonymous users)
-- Currently reactions likely has (article_id, user_id) unique constraint.
-- We add one for IP.
CREATE UNIQUE INDEX IF NOT EXISTS unique_article_ip_reaction ON reactions (article_id, ip_address) WHERE ip_address IS NOT NULL AND user_id IS NULL;

-- 4. Add RLS policies for anonymous access to tracking tables

-- Allow anonymous users to insert views (for rate limiting)
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anonymous users can insert views" ON story_views;
CREATE POLICY "Anonymous users can insert views" ON story_views FOR INSERT TO anon WITH CHECK (true);

-- Allow anonymous users to insert likes (for rate limiting)
ALTER TABLE story_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anonymous users can insert likes" ON story_likes;
CREATE POLICY "Anonymous users can insert likes" ON story_likes FOR INSERT TO anon WITH CHECK (true);

-- Allow anonymous users to insert article views (for rate limiting)
DROP POLICY IF EXISTS "Anonymous users can insert article views" ON article_views;
CREATE POLICY "Anonymous users can insert article views" ON article_views FOR INSERT TO anon WITH CHECK (true);

-- Allow anonymous users to insert reactions (for rate limiting)
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anonymous users can insert reactions" ON reactions;
CREATE POLICY "Anonymous users can insert reactions" ON reactions FOR INSERT TO anon WITH CHECK (true);

-- Allow anonymous users to delete their own reactions by IP
DROP POLICY IF EXISTS "Anonymous users can delete own reactions" ON reactions;
CREATE POLICY "Anonymous users can delete own reactions" ON reactions FOR DELETE TO anon USING (ip_address = COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', current_setting('request.headers', true)::json->>'x-real-ip', 'unknown'));

-- Grant necessary permissions
GRANT INSERT ON story_views TO anon;
GRANT INSERT ON story_likes TO anon;
GRANT INSERT ON article_views TO anon;
GRANT INSERT, DELETE ON reactions TO anon;
