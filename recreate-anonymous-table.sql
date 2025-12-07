-- Complete table recreation - this will fix all permission issues
-- WARNING: This will delete all existing anonymous messages

-- First, drop the problematic table completely
DROP TABLE IF EXISTS anonymous_messages CASCADE;

-- Also drop the reports table if it exists
DROP TABLE IF EXISTS message_reports CASCADE;

-- Now recreate the table from scratch with correct permissions
CREATE TABLE IF NOT EXISTS anonymous_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('question', 'response')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    question_id UUID REFERENCES anonymous_messages(id) ON DELETE CASCADE,
    admin_question BOOLEAN DEFAULT FALSE,
    likes_count INTEGER DEFAULT 0,
    reports_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the reports table
CREATE TABLE IF NOT EXISTS message_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES anonymous_messages(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_anonymous_messages_type ON anonymous_messages(type);
CREATE INDEX IF NOT EXISTS idx_anonymous_messages_status ON anonymous_messages(status);
CREATE INDEX IF NOT EXISTS idx_anonymous_messages_question_id ON anonymous_messages(question_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_messages_created_at ON anonymous_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anonymous_messages_admin_question ON anonymous_messages(admin_question);
CREATE INDEX IF NOT EXISTS idx_message_reports_message_id ON message_reports(message_id);

-- Create functions
CREATE OR REPLACE FUNCTION increment_likes(message_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE anonymous_messages 
    SET likes_count = likes_count + 1,
        updated_at = NOW()
    WHERE id = message_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_reports(message_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE anonymous_messages 
    SET reports_count = reports_count + 1,
        updated_at = NOW()
    WHERE id = message_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_anonymous_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_anonymous_messages_updated_at_trigger ON anonymous_messages;
CREATE TRIGGER update_anonymous_messages_updated_at_trigger
    BEFORE UPDATE ON anonymous_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_anonymous_messages_updated_at();

-- Insert sample data
INSERT INTO anonymous_messages (content, type, status, admin_question) VALUES
    ('What''s your favorite study spot on campus?', 'question', 'approved', true),
    ('How do you balance academics and social life?', 'question', 'approved', true),
    ('What advice would you give to new students?', 'question', 'approved', true)
ON CONFLICT DO NOTHING;

-- Test the table
SELECT COUNT(*) as message_count FROM anonymous_messages;
