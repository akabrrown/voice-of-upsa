-- Check if contact_submissions table exists and handle accordingly
-- This script will safely update the existing table or create it if it doesn't exist

-- First, let's check if the table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'contact_submissions'
    ) THEN
        -- Table exists, check if we need to add any missing columns
        RAISE NOTICE 'contact_submissions table already exists. Checking for missing columns...';
        
        -- Add missing columns if they don't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'contact_submissions' 
            AND column_name = 'assigned_to'
        ) THEN
            ALTER TABLE contact_submissions ADD COLUMN assigned_to UUID REFERENCES auth.users(id);
            RAISE NOTICE 'Added assigned_to column';
        END IF;
        
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'contact_submissions' 
            AND column_name = 'ip_address'
        ) THEN
            ALTER TABLE contact_submissions ADD COLUMN ip_address INET;
            RAISE NOTICE 'Added ip_address column';
        END IF;
        
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'contact_submissions' 
            AND column_name = 'user_agent'
        ) THEN
            ALTER TABLE contact_submissions ADD COLUMN user_agent TEXT;
            RAISE NOTICE 'Added user_agent column';
        END IF;
        
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'contact_submissions' 
            AND column_name = 'read_at'
        ) THEN
            ALTER TABLE contact_submissions ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
            RAISE NOTICE 'Added read_at column';
        END IF;
        
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'contact_submissions' 
            AND column_name = 'replied_at'
        ) THEN
            ALTER TABLE contact_submissions ADD COLUMN replied_at TIMESTAMP WITH TIME ZONE;
            RAISE NOTICE 'Added replied_at column';
        END IF;
        
        -- Ensure RLS is enabled
        ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
        
        -- Create/update policies
        DROP POLICY IF EXISTS "Admin full access contact_submissions" ON contact_submissions;
        CREATE POLICY "Admin full access contact_submissions" ON contact_submissions
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM auth.users 
                    WHERE auth.users.id = auth.uid() 
                    AND raw_user_meta_data->>'role' = 'admin'
                )
            );
        
        DROP POLICY IF EXISTS "Public insert contact_submissions" ON contact_submissions;
        CREATE POLICY "Public insert contact_submissions" ON contact_submissions
            FOR INSERT WITH CHECK (true);
        
        -- Grant permissions
        GRANT ALL ON contact_submissions TO authenticated;
        GRANT ALL ON contact_submissions TO service_role;
        GRANT INSERT ON contact_submissions TO anon;
        
        RAISE NOTICE 'contact_submissions table updated successfully';
        
    ELSE
        -- Table doesn't exist, create it
        RAISE NOTICE 'Creating contact_submissions table...';
        
        CREATE TABLE contact_submissions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            subject VARCHAR(500),
            message TEXT NOT NULL,
            phone VARCHAR(50),
            status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed', 'pending', 'read', 'replied', 'archived')),
            priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
            assigned_to UUID REFERENCES auth.users(id),
            ip_address INET,
            user_agent TEXT,
            read_at TIMESTAMP WITH TIME ZONE,
            replied_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_contact_submissions_status ON contact_submissions(status);
        CREATE INDEX idx_contact_submissions_created_at ON contact_submissions(created_at DESC);
        CREATE INDEX idx_contact_submissions_email ON contact_submissions(email);
        
        -- Enable RLS
        ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Admin full access contact_submissions" ON contact_submissions
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM auth.users 
                    WHERE auth.users.id = auth.uid() 
                    AND raw_user_meta_data->>'role' = 'admin'
                )
            );
        
        CREATE POLICY "Public insert contact_submissions" ON contact_submissions
            FOR INSERT WITH CHECK (true);
        
        -- Grant permissions
        GRANT ALL ON contact_submissions TO authenticated;
        GRANT ALL ON contact_submissions TO service_role;
        GRANT INSERT ON contact_submissions TO anon;
        
        RAISE NOTICE 'contact_submissions table created successfully';
    END IF;
END $$;

-- Handle message_replies table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'message_replies'
    ) THEN
        -- Create message_replies table
        CREATE TABLE message_replies (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            message_id UUID NOT NULL REFERENCES contact_submissions(id) ON DELETE CASCADE,
            admin_id UUID NOT NULL REFERENCES auth.users(id),
            reply_text TEXT NOT NULL,
            reply_method VARCHAR(20) DEFAULT 'email' CHECK (reply_method IN ('email', 'internal')),
            sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_message_replies_message_id ON message_replies(message_id);
        CREATE INDEX idx_message_replies_admin_id ON message_replies(admin_id);
        
        -- Enable RLS
        ALTER TABLE message_replies ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Admin full access message_replies" ON message_replies
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM auth.users 
                    WHERE auth.users.id = auth.uid() 
                    AND raw_user_meta_data->>'role' = 'admin'
                )
            );
        
        -- Grant permissions
        GRANT ALL ON message_replies TO authenticated;
        GRANT ALL ON message_replies TO service_role;
        
        RAISE NOTICE 'message_replies table created successfully';
    END IF;
END $$;

-- Create or update the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers if they don't exist
DROP TRIGGER IF EXISTS update_contact_submissions_updated_at ON contact_submissions;
CREATE TRIGGER update_contact_submissions_updated_at 
    BEFORE UPDATE ON contact_submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_message_replies_updated_at ON message_replies;
CREATE TRIGGER update_message_replies_updated_at 
    BEFORE UPDATE ON message_replies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Database setup completed successfully
