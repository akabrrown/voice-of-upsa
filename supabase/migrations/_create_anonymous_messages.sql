-- Anonymous Messages System Tables
-- Created for Voice of UPSA anonymous messaging feature

-- Main anonymous messages table
CREATE TABLE IF NOT EXISTS anonymous_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('question', 'response')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    question_id UUID REFERENCES anonymous_messages(id) ON DELETE CASCADE, -- For responses linking to questions
    admin_question BOOLEAN DEFAULT FALSE, -- True if admin posted this question
    likes_count INTEGER DEFAULT 0,
    reports_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message reports table for tracking reported content
CREATE TABLE IF NOT EXISTS message_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES anonymous_messages(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id) -- One report per message (can be extended to multiple reports)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_anonymous_messages_type ON anonymous_messages(type);
CREATE INDEX IF NOT EXISTS idx_anonymous_messages_status ON anonymous_messages(status);
CREATE INDEX IF NOT EXISTS idx_anonymous_messages_question_id ON anonymous_messages(question_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_messages_created_at ON anonymous_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anonymous_messages_admin_question ON anonymous_messages(admin_question);

-- Index for reports
CREATE INDEX IF NOT EXISTS idx_message_reports_message_id ON message_reports(message_id);

-- Function to increment likes count
CREATE OR REPLACE FUNCTION increment_likes(message_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE anonymous_messages 
    SET likes_count = likes_count + 1,
        updated_at = NOW()
    WHERE id = message_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment reports count
CREATE OR REPLACE FUNCTION increment_reports(message_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE anonymous_messages 
    SET reports_count = reports_count + 1,
        updated_at = NOW()
    WHERE id = message_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_anonymous_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to the anonymous_messages table
DROP TRIGGER IF EXISTS update_anonymous_messages_updated_at_trigger ON anonymous_messages;
CREATE TRIGGER update_anonymous_messages_updated_at_trigger
    BEFORE UPDATE ON anonymous_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_anonymous_messages_updated_at();

-- Row Level Security (RLS) Policies
ALTER TABLE anonymous_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;

-- Policy for anonymous_messages table
-- Everyone can read approved messages
CREATE POLICY "Approved messages are viewable by everyone" ON anonymous_messages
    FOR SELECT USING (status = 'approved');

-- Only authenticated users can insert messages
CREATE POLICY "Authenticated users can insert messages" ON anonymous_messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only admins can update messages (moderation)
CREATE POLICY "Admins can update messages" ON anonymous_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'editor')
        )
    );

-- Only admins can delete messages
CREATE POLICY "Admins can delete messages" ON anonymous_messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'editor')
        )
    );

-- Policy for message_reports table
-- Only authenticated users can insert reports
CREATE POLICY "Authenticated users can insert reports" ON message_reports
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only admins can read reports
CREATE POLICY "Admins can read reports" ON message_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'editor')
        )
    );

-- Only admins can delete reports
CREATE POLICY "Admins can delete reports" ON message_reports
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'editor')
        )
    );

-- Insert some sample data for testing (optional)
-- This can be removed in production
INSERT INTO anonymous_messages (content, type, status, admin_question) VALUES
    ('What''s your favorite study spot on campus?', 'question', 'approved', true),
    ('How do you balance academics and social life?', 'question', 'approved', true),
    ('What advice would you give to new students?', 'question', 'approved', true)
ON CONFLICT DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE anonymous_messages IS 'Stores anonymous questions and responses for the Voice of UPSA platform';
COMMENT ON COLUMN anonymous_messages.content IS 'The message content (question or response)';
COMMENT ON COLUMN anonymous_messages.type IS 'Type of message: question or response';
COMMENT ON COLUMN anonymous_messages.status IS 'Moderation status: pending, approved, or declined';
COMMENT ON COLUMN anonymous_messages.question_id IS 'Foreign key for responses linking to questions';
COMMENT ON COLUMN anonymous_messages.admin_question IS 'True if this question was posted by an admin';
COMMENT ON COLUMN anonymous_messages.likes_count IS 'Number of likes this message has received';
COMMENT ON COLUMN anonymous_messages.reports_count IS 'Number of times this message has been reported';

COMMENT ON TABLE message_reports IS 'Stores reports for inappropriate anonymous messages';
COMMENT ON COLUMN message_reports.reason IS 'Reason for reporting the message';
