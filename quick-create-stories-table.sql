-- Quick fix: Create anonymous stories table immediately
-- Run this in your Supabase SQL editor

-- Drop existing policies first if they exist
DROP POLICY IF EXISTS "Approved stories are viewable by everyone" ON anonymous_stories;
DROP POLICY IF EXISTS "Anyone can submit stories" ON anonymous_stories;

-- Drop old tables
DROP TABLE IF EXISTS anonymous_messages CASCADE;
DROP TABLE IF EXISTS message_reports CASCADE;

-- Create new stories table
CREATE TABLE IF NOT EXISTS anonymous_stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    author_type VARCHAR(20) NOT NULL DEFAULT 'anonymous' CHECK (author_type IN ('anonymous', 'user', 'non_user')),
    likes_count INTEGER DEFAULT 0,
    reports_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS story_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID NOT NULL REFERENCES anonymous_stories(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(story_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_anonymous_stories_status ON anonymous_stories(status);
CREATE INDEX IF NOT EXISTS idx_anonymous_stories_category ON anonymous_stories(category);
CREATE INDEX IF NOT EXISTS idx_anonymous_stories_featured ON anonymous_stories(featured);
CREATE INDEX IF NOT EXISTS idx_anonymous_stories_created_at ON anonymous_stories(created_at DESC);

-- Enable RLS
ALTER TABLE anonymous_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_reports ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "Approved stories are viewable by everyone" ON anonymous_stories
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Anyone can submit stories" ON anonymous_stories
    FOR INSERT WITH CHECK (
        content IS NOT NULL 
        AND title IS NOT NULL
        AND length(title) >= 5
        AND length(content) >= 50
        AND length(content) <= 2000
    );

-- Insert sample data (only if table is empty)
INSERT INTO anonymous_stories (title, content, category, status, author_type) 
SELECT 
    'My First Day at UPSA', 
    'I remember walking into UPSA for the first time, feeling nervous but excited. The campus was bigger than I expected, and everyone seemed to know where they were going. I got lost three times trying to find my first lecture hall, but a senior student showed me the way. That small act of kindness made me feel like I belonged here.', 
    'campus-life', 
    'approved', 
    'anonymous'
WHERE NOT EXISTS (SELECT 1 FROM anonymous_stories LIMIT 1);

INSERT INTO anonymous_stories (title, content, category, status, author_type) 
SELECT 
    'Late Night Study Sessions', 
    'There''s something magical about studying in the library late at night. The quiet atmosphere, the dim lighting, and the shared determination of fellow students. We exchange knowing glances over our laptops, share snacks, and sometimes even help each other with difficult concepts. These moments make the stress of exams worth it.', 
    'academics', 
    'approved', 
    'anonymous'
WHERE (SELECT COUNT(*) FROM anonymous_stories) = 1;

INSERT INTO anonymous_stories (title, content, category, status, author_type) 
SELECT 
    'The Cafeteria Mystery', 
    'Why does the food taste so different on Fridays? I''ve been trying to figure this out for months. Some say it''s a different chef, others claim it''s the ingredients. Whatever it is, Friday lunch has become something we all look forward to. It''s the little mysteries that make campus life interesting.', 
    'general', 
    'approved', 
    'anonymous'
WHERE (SELECT COUNT(*) FROM anonymous_stories) = 2;

-- Test the table
SELECT COUNT(*) as story_count FROM anonymous_stories;
