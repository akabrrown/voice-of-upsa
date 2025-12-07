-- Comprehensive fix for anonymous messages RLS policies
-- This script will handle all existing policies and create the correct ones

-- First, disable RLS temporarily to avoid conflicts
ALTER TABLE anonymous_messages DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Approved messages are viewable by everyone" ON anonymous_messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON anonymous_messages;
DROP POLICY IF EXISTS "Admins can update messages" ON anonymous_messages;
DROP POLICY IF EXISTS "Admins can delete messages" ON anonymous_messages;
DROP POLICY IF EXISTS "Admins can read all messages" ON anonymous_messages;
DROP POLICY IF EXISTS "Admins can insert questions" ON anonymous_messages;
DROP POLICY IF EXISTS "Authenticated users can insert responses" ON anonymous_messages;

-- Re-enable RLS
ALTER TABLE anonymous_messages ENABLE ROW LEVEL SECURITY;

-- Create the correct set of policies

-- 1. Public can read approved messages
CREATE POLICY "Approved messages are viewable by everyone" ON anonymous_messages
    FOR SELECT USING (status = 'approved');

-- 2. Authenticated users can insert responses only
CREATE POLICY "Authenticated users can insert responses" ON anonymous_messages
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND type = 'response'
        AND question_id IS NOT NULL
    );

-- 3. Admins can insert questions
CREATE POLICY "Admins can insert questions" ON anonymous_messages
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND type = 'question'
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'editor')
        )
        AND admin_question = true
    );

-- 4. Admins can read all messages (for moderation)
CREATE POLICY "Admins can read all messages" ON anonymous_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'editor')
        )
    );

-- 5. Admins can update all messages (for moderation)
CREATE POLICY "Admins can update all messages" ON anonymous_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'editor')
        )
    );

-- 6. Admins can delete all messages (for moderation)
CREATE POLICY "Admins can delete all messages" ON anonymous_messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'editor')
        )
    );

-- Show final policies
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'anonymous_messages'
ORDER BY policyname;
