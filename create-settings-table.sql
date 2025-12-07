-- Create comprehensive settings table for admin configuration
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  
  -- General Settings
  site_name VARCHAR(255) DEFAULT 'Voice of UPSA',
  site_description TEXT DEFAULT 'Official student publication of UPSA',
  site_url VARCHAR(255) DEFAULT 'http://localhost:3000',
  
  -- Logo Settings
  logo_url VARCHAR(500) DEFAULT '/logo.jpg',
  logo_upload_size INTEGER DEFAULT 2097152, -- 2MB in bytes
  logo_allowed_types TEXT[] DEFAULT ARRAY['jpg', 'jpeg', 'png', 'gif', 'webp'],
  
  -- Email Settings
  contact_email VARCHAR(255) DEFAULT 'voice.of.upsa.mail@gmail.com',
  notification_email VARCHAR(255) DEFAULT 'voice.of.upsa.mail@gmail.com',
  
  -- Social Media Links
  social_facebook VARCHAR(500) DEFAULT '',
  social_twitter VARCHAR(500) DEFAULT '',
  social_instagram VARCHAR(500) DEFAULT '',
  social_youtube VARCHAR(500) DEFAULT '',
  social_tiktok VARCHAR(500) DEFAULT '',
  social_linkedin VARCHAR(500) DEFAULT '',
  
  -- Feature Settings
  maintenance_mode BOOLEAN DEFAULT false,
  allow_comments BOOLEAN DEFAULT true,
  moderate_comments BOOLEAN DEFAULT false,
  
  -- Upload Settings
  max_upload_size INTEGER DEFAULT 5242880, -- 5MB in bytes
  allowed_image_types TEXT[] DEFAULT ARRAY['jpg', 'jpeg', 'png', 'gif', 'webp'],
  
  -- Ad Settings
  ad_enabled BOOLEAN DEFAULT true,
  ad_auto_approve BOOLEAN DEFAULT false,
  ad_max_per_user INTEGER DEFAULT 5,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings if table is empty
INSERT INTO settings (
  id, site_name, site_description, site_url, logo_url, logo_upload_size, logo_allowed_types,
  contact_email, notification_email, social_facebook, social_twitter, social_instagram,
  social_youtube, social_tiktok, social_linkedin, maintenance_mode, allow_comments,
  moderate_comments, max_upload_size, allowed_image_types, ad_enabled, ad_auto_approve, ad_max_per_user
)
SELECT 
  1, 'Voice of UPSA', 'Official student publication of UPSA', 'http://localhost:3000', 
  '/logo.jpg', 2097152, ARRAY['jpg', 'jpeg', 'png', 'gif', 'webp'],
  'voice.of.upsa.mail@gmail.com', 'voice.of.upsa.mail@gmail.com', '', '', '', '', '', '',
  false, true, false, 5242880, ARRAY['jpg', 'jpeg', 'png', 'gif', 'webp'], true, false, 5
WHERE NOT EXISTS (SELECT 1 FROM settings);

-- Disable RLS for settings table when using service role key
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
