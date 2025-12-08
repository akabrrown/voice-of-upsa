-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own data (needed for role check on login)
CREATE POLICY "Users can read own data" ON users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Allow admins/editors to read all users (if needed for management)
CREATE POLICY "Admins can read all users" ON users
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'editor')
        )
    );
