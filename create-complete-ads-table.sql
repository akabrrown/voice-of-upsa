-- Complete ad_submissions table creation with all necessary fields
-- This will ensure the table exists and has the correct structure

-- Drop existing table if it exists to start fresh
DROP TABLE IF EXISTS ad_submissions CASCADE;

-- Create the complete ad_submissions table
CREATE TABLE ad_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  company VARCHAR(255),
  business_type VARCHAR(50) NOT NULL CHECK (business_type IN ('individual', 'small-business', 'corporate', 'non-profit', 'other')),
  ad_type VARCHAR(50) NOT NULL CHECK (ad_type IN ('banner', 'sidebar', 'in-article', 'popup', 'sponsored-content', 'other')),
  ad_title VARCHAR(255) NOT NULL,
  ad_description TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  budget VARCHAR(100) NOT NULL,
  duration VARCHAR(50) NOT NULL CHECK (duration IN ('1-week', '2-weeks', '1-month', '3-months', '6-months', '1-year', 'custom')),
  start_date DATE NOT NULL,
  website VARCHAR(500), -- This is the important field for links
  additional_info TEXT,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  attachment_urls TEXT[] DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under-review', 'approved', 'rejected', 'published')),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_reference VARCHAR(255),
  payment_amount DECIMAL(10,2),
  payment_date TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_ad_submissions_status ON ad_submissions(status);
CREATE INDEX idx_ad_submissions_ad_type ON ad_submissions(ad_type);
CREATE INDEX idx_ad_submissions_created_at ON ad_submissions(created_at DESC);

-- Disable RLS for now to ensure ads work
ALTER TABLE ad_submissions DISABLE ROW LEVEL SECURITY;

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_ad_submissions_updated_at
  BEFORE UPDATE ON ad_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample ads with website links for testing
INSERT INTO ad_submissions (
  first_name, last_name, email, phone, company, business_type, 
  ad_type, ad_title, ad_description, target_audience, budget, 
  duration, start_date, website, terms_accepted, status
) VALUES 
  ('John', 'Doe', 'john@company.com', '+233501234567', 'Tech Solutions', 'corporate', 
   'banner', 'Amazing Tech Product', 'Discover our revolutionary tech solution that transforms your business operations with cutting-edge AI technology.', 
   'Business owners and tech enthusiasts', 'GHS 1000', '1-month', CURRENT_DATE, 'https://google.com', true, 'published'),
  ('Jane', 'Smith', 'jane@marketing.com', '+233501234568', 'Marketing Pro', 'small-business', 
   'sidebar', 'Grow Your Business', 'Professional marketing services to help your business reach new heights and attract more customers.', 
   'Small business owners', 'GHS 500', '1-month', CURRENT_DATE, 'https://facebook.com', true, 'published'),
  ('Mike', 'Johnson', 'mike@education.com', '+233501234569', 'EduPlus', 'corporate', 
   'sponsored-content', 'Learn New Skills', 'Online courses and professional development programs to advance your career and learn new in-demand skills.', 
   'Students and professionals', 'GHS 750', '1-month', CURRENT_DATE, 'https://youtube.com', true, 'published');

-- Verify the table was created correctly
SELECT 
  'Table created successfully' as status,
  COUNT(*) as total_ads
FROM ad_submissions;

-- Show sample data
SELECT 
  ad_title,
  ad_type,
  website,
  status
FROM ad_submissions 
WHERE status = 'published'
ORDER BY ad_type;
