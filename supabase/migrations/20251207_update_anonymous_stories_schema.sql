-- Add missing count columns to anonymous_stories
ALTER TABLE anonymous_stories 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Create story_likes table for tracking unique likes
CREATE TABLE IF NOT EXISTS story_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID REFERENCES anonymous_stories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT, -- For anonymous users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure one like per user OR per session per story
    CONSTRAINT unique_user_like UNIQUE (story_id, user_id),
    CONSTRAINT unique_session_like UNIQUE (story_id, session_id),
    -- Ensure at least one of user_id or session_id is present
    CONSTRAINT user_or_session_required CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Enable RLS on story_likes
ALTER TABLE story_likes ENABLE ROW LEVEL SECURITY;

-- Grant access to service role
GRANT ALL ON TABLE story_likes TO service_role;

-- Safely create policy for story_likes
DROP POLICY IF EXISTS "Service role full access on story_likes" ON story_likes;
CREATE POLICY "Service role full access on story_likes" ON story_likes
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
