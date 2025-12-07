-- Create likes tracking table to prevent multiple likes from same user
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS story_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID NOT NULL REFERENCES anonymous_stories(id) ON DELETE CASCADE,
    user_id UUID, -- null for anonymous users
    session_id TEXT, -- for tracking anonymous users by session
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(story_id, user_id),
    UNIQUE(story_id, session_id)
);

-- Disable RLS for this table (for now)
ALTER TABLE story_likes DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON story_likes TO anon;
GRANT ALL ON story_likes TO authenticated;
