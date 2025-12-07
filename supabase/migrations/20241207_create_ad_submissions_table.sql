-- Create ad_submissions table
CREATE TABLE IF NOT EXISTS ad_submissions (
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
  website VARCHAR(500),
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
CREATE INDEX IF NOT EXISTS idx_ad_submissions_status ON ad_submissions(status);
CREATE INDEX IF NOT EXISTS idx_ad_submissions_ad_type ON ad_submissions(ad_type);
CREATE INDEX IF NOT EXISTS idx_ad_submissions_created_at ON ad_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_submissions_email ON ad_submissions(email);

-- Enable RLS (Row Level Security)
ALTER TABLE ad_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow anyone to insert submissions (for ad submission form)
CREATE POLICY "Anyone can insert ad submissions" ON ad_submissions
  FOR INSERT WITH CHECK (true);

-- Allow authenticated users to view their own submissions
CREATE POLICY "Users can view own submissions" ON ad_submissions
  FOR SELECT USING (
    auth.uid()::text = (
      SELECT id FROM users WHERE email = ad_submissions.email
    )
  );

-- Allow admins to view all submissions
CREATE POLICY "Admins can view all submissions" ON ad_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to update all submissions
CREATE POLICY "Admins can update submissions" ON ad_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to delete submissions
CREATE POLICY "Admins can delete submissions" ON ad_submissions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_ad_submissions_updated_at
  BEFORE UPDATE ON ad_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert a sample ad for testing
INSERT INTO ad_submissions (
  first_name,
  last_name,
  email,
  phone,
  company,
  business_type,
  ad_type,
  ad_title,
  ad_description,
  target_audience,
  budget,
  duration,
  start_date,
  website,
  terms_accepted,
  status
) VALUES (
  'Test',
  'Advertiser',
  'test@example.com',
  '+233501234567',
  'Test Company',
  'corporate',
  'banner',
  'Sample Banner Ad',
  'This is a sample banner advertisement for testing purposes. It should appear on the homepage.',
  'UPSA students and faculty',
  'GHS 500',
  '1-month',
  CURRENT_DATE,
  'https://example.com',
  true,
  'published'
) ON CONFLICT DO NOTHING;
