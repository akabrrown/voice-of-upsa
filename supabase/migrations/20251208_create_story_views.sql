-- Create story_views table for tracking unique views
CREATE TABLE IF NOT EXISTS story_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID REFERENCES anonymous_stories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT, -- For anonymous users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure one view per user OR per session per story
    CONSTRAINT unique_user_view UNIQUE (story_id, user_id),
    CONSTRAINT unique_session_view UNIQUE (story_id, session_id),
    -- Ensure at least one of user_id or session_id is present
    CONSTRAINT user_or_session_view_required CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Enable RLS on story_views
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- Grant access to service role
GRANT ALL ON TABLE story_views TO service_role;

-- Safely create policy for story_views for Service Role
DROP POLICY IF EXISTS "Service role full access on story_views" ON story_views;
CREATE POLICY "Service role full access on story_views" ON story_views
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
