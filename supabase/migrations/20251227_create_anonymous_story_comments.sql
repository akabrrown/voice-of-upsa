-- Anonymous story comments table enables public discussion threads under approved stories
CREATE TABLE IF NOT EXISTS anonymous_story_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID NOT NULL REFERENCES anonymous_stories(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'hidden')),
    session_fingerprint TEXT,
    ip_hash TEXT,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anonymous_story_comments_story ON anonymous_story_comments(story_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_story_comments_created_at ON anonymous_story_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anonymous_story_comments_status ON anonymous_story_comments(status);

ALTER TABLE anonymous_story_comments ENABLE ROW LEVEL SECURITY;

-- Public consumers can view visible comments that belong to approved stories
DROP POLICY IF EXISTS "Public can view visible comments" ON anonymous_story_comments;
CREATE POLICY "Public can view visible comments" ON anonymous_story_comments
    FOR SELECT
    TO anon, authenticated
    USING (
        status = 'visible' AND
        EXISTS (
            SELECT 1
            FROM anonymous_stories
            WHERE anonymous_stories.id = anonymous_story_comments.story_id
              AND anonymous_stories.status = 'approved'
        )
    );

-- Anyone (even anonymous sessions) may create visible comments
DROP POLICY IF EXISTS "Anyone can create visible comments" ON anonymous_story_comments;
CREATE POLICY "Anyone can create visible comments" ON anonymous_story_comments
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        status = 'visible'
    );

-- Admins and editors may manage comments (hide/delete)
DROP POLICY IF EXISTS "Admins can moderate comments" ON anonymous_story_comments;
CREATE POLICY "Admins can moderate comments" ON anonymous_story_comments
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
              AND users.role IN ('admin', 'editor')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
              AND users.role IN ('admin', 'editor')
        )
    );

GRANT ALL ON TABLE anonymous_story_comments TO service_role;
GRANT SELECT, INSERT ON TABLE anonymous_story_comments TO anon, authenticated;
