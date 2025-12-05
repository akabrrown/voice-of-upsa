-- Create media_files table to track uploaded media
CREATE TABLE media_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    public_url TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_media_files_user_id ON media_files(user_id);
CREATE INDEX idx_media_files_created_at ON media_files(created_at DESC);
CREATE INDEX idx_media_files_content_type ON media_files(content_type);

-- Enable RLS
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own media" ON media_files
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own media" ON media_files
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media" ON media_files
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media" ON media_files
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON media_files TO authenticated;
GRANT ALL ON media_files TO service_role;

-- Create storage bucket for media files
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Public media access" ON storage.objects
    FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Users can upload their own media" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'media' AND 
        (auth.role() = 'authenticated' OR auth.role() = 'service_role')
    );

CREATE POLICY "Users can update their own media" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'media' AND 
        (auth.role() = 'authenticated' OR auth.role() = 'service_role')
    );

CREATE POLICY "Users can delete their own media" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'media' AND 
        (auth.role() = 'authenticated' OR auth.role() = 'service_role')
    );

-- Grant storage permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.objects TO service_role;
