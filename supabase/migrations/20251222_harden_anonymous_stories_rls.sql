-- RLS Hardening for anonymous_stories
-- This ensures public users can view approved stories while keeping moderation restricted

-- 1. Ensure RLS is enabled
ALTER TABLE anonymous_stories ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Public can view approved stories
DROP POLICY IF EXISTS "Public can view approved stories" ON anonymous_stories;
CREATE POLICY "Public can view approved stories" ON anonymous_stories
    FOR SELECT
    TO anon, authenticated
    USING (status = 'approved');

-- 3. Policy: Authenticated users can submit stories (INSERT only)
-- Note: status must be 'pending' for non-admin inserts
DROP POLICY IF EXISTS "Anyone can submit stories" ON anonymous_stories;
CREATE POLICY "Anyone can submit stories" ON anonymous_stories
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (status = 'pending');

-- 4. Policy: Admins and Editors have full access
DROP POLICY IF EXISTS "Admins can do everything on anonymous_stories" ON anonymous_stories;
CREATE POLICY "Admins can do everything on anonymous_stories" ON anonymous_stories
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

-- 5. Similar hardening for story_reports
ALTER TABLE story_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can report a story" ON story_reports;
CREATE POLICY "Anyone can report a story" ON story_reports
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage reports" ON story_reports;
CREATE POLICY "Admins can manage reports" ON story_reports
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'editor')
        )
    );

-- 6. Harden contact_messages
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can send a message" ON contact_messages;
CREATE POLICY "Anyone can send a message" ON contact_messages
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage messages" ON contact_messages;
CREATE POLICY "Admins can manage messages" ON contact_messages
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'editor')
        )
    );
