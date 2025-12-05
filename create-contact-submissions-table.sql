-- Create contact_submissions table
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

-- Create indexes for better performance
CREATE INDEX idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX idx_contact_submissions_created_at ON contact_submissions(created_at DESC);
CREATE INDEX idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX idx_message_replies_message_id ON message_replies(message_id);
CREATE INDEX idx_message_replies_admin_id ON message_replies(admin_id);

-- Enable RLS (Row Level Security)
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_replies ENABLE ROW LEVEL SECURITY;

-- Create policies for contact_submissions
-- Admin users can do everything
CREATE POLICY "Admin full access contact_submissions" ON contact_submissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Non-admin users can only insert (for contact form submissions)
CREATE POLICY "Public insert contact_submissions" ON contact_submissions
    FOR INSERT WITH CHECK (true);

-- Create policies for message_replies
-- Admin users can do everything
CREATE POLICY "Admin full access message_replies" ON message_replies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Grant permissions
GRANT ALL ON contact_submissions TO authenticated;
GRANT ALL ON contact_submissions TO service_role;
GRANT ALL ON message_replies TO authenticated;
GRANT ALL ON message_replies TO service_role;

-- Allow public insert for contact form (anonymous users)
GRANT INSERT ON contact_submissions TO anon;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contact_submissions_updated_at 
    BEFORE UPDATE ON contact_submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_replies_updated_at 
    BEFORE UPDATE ON message_replies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
