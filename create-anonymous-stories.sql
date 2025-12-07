-- Anonymous Stories System - New Schema
-- Replaces question/response system with story submission and review

-- Drop old tables and recreate with new structure
DROP TABLE IF EXISTS anonymous_messages CASCADE;
DROP TABLE IF EXISTS message_reports CASCADE;

-- New anonymous stories table
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

-- Story reports table
CREATE TABLE IF NOT EXISTS story_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID NOT NULL REFERENCES anonymous_stories(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(story_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_anonymous_stories_status ON anonymous_stories(status);
CREATE INDEX IF NOT EXISTS idx_anonymous_stories_category ON anonymous_stories(category);
CREATE INDEX IF NOT EXISTS idx_anonymous_stories_featured ON anonymous_stories(featured);
CREATE INDEX IF NOT EXISTS idx_anonymous_stories_created_at ON anonymous_stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_reports_story_id ON story_reports(story_id);

-- Functions
CREATE OR REPLACE FUNCTION increment_story_likes(story_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE anonymous_stories 
    SET likes_count = likes_count + 1,
        updated_at = NOW()
    WHERE id = story_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_story_reports(story_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE anonymous_stories 
    SET reports_count = reports_count + 1,
        updated_at = NOW()
    WHERE id = story_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_anonymous_stories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS update_anonymous_stories_updated_at_trigger ON anonymous_stories;
CREATE TRIGGER update_anonymous_stories_updated_at_trigger
    BEFORE UPDATE ON anonymous_stories
    FOR EACH ROW
    EXECUTE FUNCTION update_anonymous_stories_updated_at();

-- Enable RLS
ALTER TABLE anonymous_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can read approved stories
CREATE POLICY "Approved stories are viewable by everyone" ON anonymous_stories
    FOR SELECT USING (status = 'approved');

-- Anyone can submit stories (will be pending review)
CREATE POLICY "Anyone can submit stories" ON anonymous_stories
    FOR INSERT WITH CHECK (
        content IS NOT NULL 
        AND title IS NOT NULL
        AND length(title) >= 5
        AND length(content) >= 50
        AND length(content) <= 2000
    );

-- Admins can read all stories for moderation
CREATE POLICY "Admins can read all stories" ON anonymous_stories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'editor')
        )
    );

-- Admins can update stories (moderation)
CREATE POLICY "Admins can update stories" ON anonymous_stories
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'editor')
        )
    );

-- Admins can delete stories
CREATE POLICY "Admins can delete stories" ON anonymous_stories
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'editor')
        )
    );

-- Story reports policies
-- Anyone can report stories
CREATE POLICY "Anyone can report stories" ON story_reports
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Admins can read reports
CREATE POLICY "Admins can read story reports" ON story_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'editor')
        )
    );

-- Admins can delete reports
CREATE POLICY "Admins can delete story reports" ON story_reports
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'editor')
        )
    );

-- Insert sample stories
INSERT INTO anonymous_stories (title, content, category, status, author_type) VALUES
    ('My First Day at UPSA', 'I remember walking into UPSA for the first time, feeling nervous but excited. The campus was bigger than I expected, and everyone seemed to know where they were going. I got lost three times trying to find my first lecture hall, but a senior student showed me the way. That small act of kindness made me feel like I belonged here.', 'campus-life', 'approved', 'anonymous'),
    ('Late Night Study Sessions', 'There''s something magical about studying in the library late at night. The quiet atmosphere, the dim lighting, and the shared determination of fellow students. We exchange knowing glances over our laptops, share snacks, and sometimes even help each other with difficult concepts. These moments make the stress of exams worth it.', 'academics', 'approved', 'anonymous'),
    ('The Cafeteria Mystery', 'Why does the food taste so different on Fridays? I''ve been trying to figure this out for months. Some say it''s a different chef, others claim it''s the ingredients. Whatever it is, Friday lunch has become something we all look forward to. It''s the little mysteries that make campus life interesting.', 'general', 'pending', 'anonymous')
ON CONFLICT DO NOTHING;

-- Test the table
SELECT COUNT(*) as story_count FROM anonymous_stories;
