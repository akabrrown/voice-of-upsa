-- Create ad_locations table
CREATE TABLE IF NOT EXISTS ad_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  page_location VARCHAR(100) NOT NULL,
  position_type VARCHAR(50) NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  base_price DECIMAL(10, 2),
  dimensions VARCHAR(50),
  max_file_size_mb INTEGER DEFAULT 5,
  allowed_file_types TEXT[] DEFAULT ARRAY['image/jpeg', 'image/png', 'image/gif'],
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create junction table for ad submissions and locations (many-to-many relationship)
CREATE TABLE IF NOT EXISTS ad_submission_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_submission_id UUID NOT NULL REFERENCES ad_submissions(id) ON DELETE CASCADE,
  ad_location_id UUID NOT NULL REFERENCES ad_locations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ad_submission_id, ad_location_id)
);

-- Remove custom placement if it exists
DELETE FROM ad_locations WHERE name = 'custom_placement';

-- Insert default ad locations (without custom placement)
INSERT INTO ad_locations (name, display_name, description, page_location, position_type, is_premium, base_price, dimensions) VALUES
('homepage_banner', 'Homepage Banner', 'Large banner at the top of the homepage', 'homepage', 'banner', true, 1500.00, '1200x300'),
('homepage_sidebar', 'Homepage Sidebar', 'Sidebar banner on the homepage', 'homepage', 'sidebar', false, 750.00, '300x250'),
('articles_banner', 'Articles Page Banner', 'Banner at the top of articles listing page', 'articles', 'banner', true, 1200.00, '1200x300'),
('articles_sidebar', 'Articles Sidebar', 'Sidebar in articles listing page', 'articles', 'sidebar', false, 600.00, '300x250'),
('article_in_article', 'In-Article Ad', 'Advertisement within article content', 'article', 'in-article', true, 1000.00, '728x90'),
('article_popup', 'Article Popup Ad', 'Popup advertisement on article pages', 'article', 'popup', true, 800.00, '500x500'),
('article_sidebar', 'Article Sidebar', 'Sidebar on individual article pages', 'article', 'sidebar', false, 500.00, '300x250'),
('anonymous_stories_banner', 'Anonymous Stories Banner', 'Banner on anonymous stories page', 'anonymous_stories', 'banner', false, 400.00, '1200x300'),
('sponsored_content', 'Sponsored Content', 'Sponsored article placement on homepage', 'homepage', 'sponsored', true, 2000.00, 'Variable')
ON CONFLICT (name) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ad_locations_is_active ON ad_locations(is_active);
CREATE INDEX IF NOT EXISTS idx_ad_locations_page_location ON ad_locations(page_location);
CREATE INDEX IF NOT EXISTS idx_ad_submission_locations_ad_submission_id ON ad_submission_locations(ad_submission_id);
CREATE INDEX IF NOT EXISTS idx_ad_submission_locations_ad_location_id ON ad_submission_locations(ad_location_id);

-- Enable RLS
ALTER TABLE ad_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_submission_locations ENABLE ROW LEVEL SECURITY;

-- Create policies for ad_locations (everyone can read, only admins can write)
CREATE POLICY "Anyone can view active ad locations" ON ad_locations
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage ad locations" ON ad_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create policies for ad_submission_locations
CREATE POLICY "Anyone can view ad submission locations" ON ad_submission_locations
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage ad submission locations" ON ad_submission_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Grant permissions
GRANT SELECT ON ad_locations TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ad_locations TO authenticated, service_role;
GRANT SELECT ON ad_submission_locations TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ad_submission_locations TO authenticated, service_role;

-- Add trigger for updated_at (if update_updated_at_column function exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_ad_locations_updated_at
        BEFORE UPDATE ON ad_locations
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
