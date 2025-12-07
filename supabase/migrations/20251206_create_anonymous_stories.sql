-- Create anonymous_stories table
CREATE TABLE IF NOT EXISTS anonymous_stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT,
    content TEXT,
    category TEXT,
    author_type TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    featured BOOLEAN DEFAULT FALSE,
    reports_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create story_reports table
CREATE TABLE IF NOT EXISTS story_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID REFERENCES anonymous_stories(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_anonymous_stories_status ON anonymous_stories(status);
CREATE INDEX IF NOT EXISTS idx_story_reports_story_id ON story_reports(story_id);

-- Enable RLS
ALTER TABLE anonymous_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_reports ENABLE ROW LEVEL SECURITY;

-- Policies for anonymous_stories

-- Explicit policy for service role (safeguard, though service key usually bypasses RLS)
CREATE POLICY "Service role full access on anonymous_stories" ON anonymous_stories
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Admins can view/edit all stories
CREATE POLICY "Admins can do everything on anonymous_stories" ON anonymous_stories
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'editor')
        )
    );

-- Policies for story_reports

-- Service role access
CREATE POLICY "Service role full access on story_reports" ON story_reports
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Admins can view/manage reports
CREATE POLICY "Admins can do everything on story_reports" ON story_reports
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'editor')
        )
    );

-- Grants to ensure basic access
GRANT ALL ON TABLE anonymous_stories TO service_role;
GRANT ALL ON TABLE story_reports TO service_role;

GRANT SELECT, INSERT ON TABLE anonymous_stories TO authenticated;
GRANT SELECT, INSERT ON TABLE story_reports TO authenticated;
