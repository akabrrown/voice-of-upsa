-- Update RLS policies to restrict question creation to admins only
-- This ensures that only administrators can create questions through the database layer

-- First, let's see the current policies
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'anonymous_messages';

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON anonymous_messages;
DROP POLICY IF EXISTS "Authenticated users can insert responses" ON anonymous_messages;
DROP POLICY IF EXISTS "Admins can insert questions" ON anonymous_messages;
DROP POLICY IF EXISTS "Admins can read all messages" ON anonymous_messages;
DROP POLICY IF EXISTS "Admins can update all messages" ON anonymous_messages;
DROP POLICY IF EXISTS "Admins can delete all messages" ON anonymous_messages;
DROP POLICY IF EXISTS "Approved messages are viewable by everyone" ON anonymous_messages;

-- Create new restrictive policies for different message types

-- Policy for inserting responses (allowed by all authenticated users)
CREATE POLICY "Authenticated users can insert responses" ON anonymous_messages
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND type = 'response'
        AND question_id IS NOT NULL
    );

-- Policy for inserting questions (admin only)
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

-- Policy for admins to read all messages (for moderation)
CREATE POLICY "Admins can read all messages" ON anonymous_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'editor')
        )
    );

-- Policy for admins to update all messages (for moderation)
CREATE POLICY "Admins can update all messages" ON anonymous_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'editor')
        )
    );

-- Policy for admins to delete all messages (for moderation)
CREATE POLICY "Admins can delete all messages" ON anonymous_messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'editor')
        )
    );

-- Keep the existing policy for approved messages to be viewable by everyone
CREATE POLICY "Approved messages are viewable by everyone" ON anonymous_messages
    FOR SELECT USING (status = 'approved');

-- Verify the new policies
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'anonymous_messages'
ORDER BY policyname;
