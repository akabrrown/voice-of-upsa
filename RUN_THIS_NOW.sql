-- =====================================================
-- RUN THIS SQL IN SUPABASE DASHBOARD NOW
-- =====================================================

-- Drop the problematic table completely
DROP TABLE IF EXISTS site_settings CASCADE;

-- Recreate table with NO RLS
CREATE TABLE site_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    site_name VARCHAR(100) NOT NULL DEFAULT 'Voice of UPSA',
    site_description TEXT NOT NULL DEFAULT 'Empowering the University of Professional Studies community through quality journalism',
    site_url VARCHAR(255) NOT NULL DEFAULT 'http://localhost:3000/',
    contact_email VARCHAR(255) NOT NULL DEFAULT 'voice.of.upsa.mail@gmail.com',
    notification_email VARCHAR(255) NOT NULL DEFAULT 'voice.of.upsa.mail@gmail.com',
    social_links JSONB DEFAULT '{}',
    maintenance_mode BOOLEAN DEFAULT false,
    allow_comments BOOLEAN DEFAULT true,
    moderate_comments BOOLEAN DEFAULT true,
    max_upload_size INTEGER DEFAULT 5242880,
    allowed_image_types JSONB DEFAULT '["jpg", "jpeg", "png", "gif", "webp"]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DO NOT ENABLE RLS - KEEP IT DISABLED
-- RLS is disabled by default on new tables

-- Insert default settings
INSERT INTO site_settings (
    id,
    site_name,
    site_description,
    site_url,
    contact_email,
    notification_email,
    social_links,
    maintenance_mode,
    allow_comments,
    moderate_comments,
    max_upload_size,
    allowed_image_types
) VALUES (
    'default',
    'Voice of UPSA',
    'Empowering the University of Professional Studies community through quality journalism',
    'http://localhost:3000/',
    'voice.of.upsa.mail@gmail.com',
    'voice.of.upsa.mail@gmail.com',
    '{
        "facebook": "https://www.facebook.com/share/1BEPXAC6oZ/?mibextid=wwXIfr",
        "twitter": "https://x.com/voice_of_upsa?s=21",
        "instagram": "https://www.instagram.com/voice.of.upsa?igsh=MWtqcnVodWMwMmNtcg%3D%3D&utm_source=qr",
        "tiktok": "https://www.tiktok.com/@voice_of_upsa?_t=ZM-8z76SV0K9I5&_r=1"
    }',
    false,
    true,
    true,
    5242880,
    '["jpg", "jpeg", "png", "gif", "webp"]'
);

-- Verify it worked
SELECT 'SUCCESS: Table created without RLS' as status;
SELECT COUNT(*) as total_settings FROM site_settings;
SELECT * FROM site_settings WHERE id = 'default';
