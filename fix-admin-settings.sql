-- Fix admin settings issues
-- Run this to ensure site_settings table is properly configured

-- Create site_settings table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'site_settings') THEN
        CREATE TABLE site_settings (
            id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
            site_name VARCHAR(255) NOT NULL DEFAULT 'Voice of UPSA',
            site_description TEXT NOT NULL DEFAULT 'Empowering the University of Professional Studies community through quality journalism',
            site_url VARCHAR(500) NOT NULL DEFAULT 'https://voiceofupsa.com',
            site_logo VARCHAR(500) DEFAULT '/logo.jpg',
            contact_email VARCHAR(255) NOT NULL DEFAULT 'voice@upsa.edu.gh',
            notification_email VARCHAR(255) NOT NULL DEFAULT 'notifications@upsa.edu.gh',
            social_links JSONB DEFAULT '{"facebook":"https://facebook.com/voiceofupsa","twitter":"https://twitter.com/voiceofupsa","instagram":"https://instagram.com/voiceofupsa","youtube":"https://youtube.com/@voiceofupsa","tiktok":"https://tiktok.com/@voice_of_upsa","linkedin":"https://linkedin.com/company/voiceofupsa"}'::jsonb,
            maintenance_mode BOOLEAN DEFAULT FALSE,
            allow_comments BOOLEAN DEFAULT TRUE,
            moderate_comments BOOLEAN DEFAULT TRUE,
            max_upload_size INTEGER DEFAULT 5242880, -- 5MB
            allowed_image_types JSONB DEFAULT '["jpg","jpeg","png","gif","webp"]'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created site_settings table';
    ELSE
        RAISE NOTICE 'site_settings table already exists';
    END IF;
END $$;

-- Disable RLS for admin operations
ALTER TABLE site_settings DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON site_settings TO postgres;
GRANT ALL ON site_settings TO authenticated;
GRANT ALL ON site_settings TO service_role;
GRANT ALL ON site_settings TO PUBLIC;

-- Insert default settings if table is empty
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM site_settings LIMIT 1) THEN
        INSERT INTO site_settings (
            id, site_name, site_description, site_url, site_logo,
            contact_email, notification_email, social_links,
            maintenance_mode, allow_comments, moderate_comments,
            max_upload_size, allowed_image_types
        ) VALUES (
            'default',
            'Voice of UPSA',
            'Empowering the University of Professional Studies community through quality journalism',
            'https://voiceofupsa.com',
            '/logo.jpg',
            'voice@upsa.edu.gh',
            'notifications@upsa.edu.gh',
            '{"facebook":"https://facebook.com/voiceofupsa","twitter":"https://twitter.com/voiceofupsa","instagram":"https://instagram.com/voiceofupsa","youtube":"https://youtube.com/@voiceofupsa","tiktok":"https://tiktok.com/@voice_of_upsa","linkedin":"https://linkedin.com/company/voiceofupsa"}',
            FALSE,
            TRUE,
            TRUE,
            5242880,
            '["jpg","jpeg","png","gif","webp"]'
        );
        
        RAISE NOTICE 'Inserted default site settings';
    ELSE
        RAISE NOTICE 'Site settings already exist';
    END IF;
END $$;

-- Verify the setup
SELECT 
    'site_settings table exists' as check_item,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'site_settings') as status
UNION ALL
SELECT 
    'default settings exist',
    EXISTS (SELECT 1 FROM site_settings WHERE id = 'default')
UNION ALL
SELECT 
    'table has proper columns',
    COUNT(*) = 13
FROM information_schema.columns 
WHERE table_name = 'site_settings' 
    AND column_name IN (
        'id', 'site_name', 'site_description', 'site_url', 'site_logo',
        'contact_email', 'notification_email', 'social_links',
        'maintenance_mode', 'allow_comments', 'moderate_comments',
        'max_upload_size', 'allowed_image_types'
    );

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add maintenance_mode column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'maintenance_mode') THEN
        ALTER TABLE site_settings ADD COLUMN maintenance_mode BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added maintenance_mode column';
    END IF;
    
    -- Add allow_comments column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'allow_comments') THEN
        ALTER TABLE site_settings ADD COLUMN allow_comments BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added allow_comments column';
    END IF;
    
    -- Add moderate_comments column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'moderate_comments') THEN
        ALTER TABLE site_settings ADD COLUMN moderate_comments BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added moderate_comments column';
    END IF;
    
    -- Add max_upload_size column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'max_upload_size') THEN
        ALTER TABLE site_settings ADD COLUMN max_upload_size INTEGER DEFAULT 5242880; -- 5MB
        RAISE NOTICE 'Added max_upload_size column';
    END IF;
    
    -- Add allowed_image_types column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'allowed_image_types') THEN
        ALTER TABLE site_settings ADD COLUMN allowed_image_types JSONB DEFAULT '["jpg","jpeg","png","gif","webp"]'::jsonb;
        RAISE NOTICE 'Added allowed_image_types column';
    END IF;
END $$;

-- Update existing settings to have default values for new columns
UPDATE site_settings 
SET 
    maintenance_mode = COALESCE(maintenance_mode, FALSE),
    allow_comments = COALESCE(allow_comments, TRUE),
    moderate_comments = COALESCE(moderate_comments, TRUE),
    max_upload_size = COALESCE(max_upload_size, 5242880),
    allowed_image_types = COALESCE(allowed_image_types, '["jpg","jpeg","png","gif","webp"]'::jsonb)
WHERE id = 'default';

-- Final verification of all required columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'site_settings' 
    AND column_name IN (
        'maintenance_mode', 'allow_comments', 'moderate_comments',
        'max_upload_size', 'allowed_image_types'
    )
ORDER BY column_name;
