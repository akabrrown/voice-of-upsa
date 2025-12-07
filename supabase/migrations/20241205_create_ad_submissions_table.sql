-- Create ad_submissions table
CREATE TABLE IF NOT EXISTS ad_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  company VARCHAR(255),
  business_type VARCHAR(50) NOT NULL CHECK (business_type IN ('individual', 'small-business', 'corporate', 'non-profit', 'other')),
  ad_type VARCHAR(50) NOT NULL CHECK (ad_type IN ('banner', 'sidebar', 'in-article', 'popup', 'sponsored-content', 'other')),
  ad_title VARCHAR(500) NOT NULL,
  ad_description TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  budget VARCHAR(100) NOT NULL,
  duration VARCHAR(50) NOT NULL CHECK (duration IN ('1-week', '2-weeks', '1-month', '3-months', '6-months', '1-year', 'custom')),
  start_date DATE NOT NULL,
  website TEXT,
  additional_info TEXT,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  attachment_urls TEXT[],
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under-review', 'approved', 'rejected', 'published')),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_reference VARCHAR(255),
  payment_amount DECIMAL(10, 2),
  payment_date TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_ad_submissions_status ON ad_submissions(status);
CREATE INDEX idx_ad_submissions_email ON ad_submissions(email);
CREATE INDEX idx_ad_submissions_created_at ON ad_submissions(created_at);
CREATE INDEX idx_ad_submissions_payment_reference ON ad_submissions(payment_reference);

-- Create RLS (Row Level Security) policies
ALTER TABLE ad_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own submissions
CREATE POLICY "Users can view own ad submissions" ON ad_submissions
  FOR SELECT USING (auth.uid() IS NULL OR email = auth.email());

-- Policy: Admins can view all submissions
CREATE POLICY "Admins can view all ad submissions" ON ad_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy: Anyone can insert submissions (for the form submission)
CREATE POLICY "Anyone can insert ad submissions" ON ad_submissions
  FOR INSERT WITH CHECK (true);

-- Policy: Admins can update submissions
CREATE POLICY "Admins can update ad submissions" ON ad_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy: Admins can delete submissions
CREATE POLICY "Admins can delete ad submissions" ON ad_submissions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create function to update updated_at timestamp
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

-- Add comments for documentation
COMMENT ON TABLE ad_submissions IS 'Table to store advertisement submissions from users';
COMMENT ON COLUMN ad_submissions.first_name IS 'First name of the submitter';
COMMENT ON COLUMN ad_submissions.last_name IS 'Last name of the submitter';
COMMENT ON COLUMN ad_submissions.email IS 'Email address of the submitter';
COMMENT ON COLUMN ad_submissions.phone IS 'Phone number of the submitter';
COMMENT ON COLUMN ad_submissions.company IS 'Company name (optional)';
COMMENT ON COLUMN ad_submissions.business_type IS 'Type of business (individual, small-business, corporate, non-profit, other)';
COMMENT ON COLUMN ad_submissions.ad_type IS 'Type of advertisement (banner, sidebar, in-article, popup, sponsored-content, other)';
COMMENT ON COLUMN ad_submissions.ad_title IS 'Title of the advertisement';
COMMENT ON COLUMN ad_submissions.ad_description IS 'Detailed description of the advertisement';
COMMENT ON COLUMN ad_submissions.target_audience IS 'Description of the target audience';
COMMENT ON COLUMN ad_submissions.budget IS 'Budget for the advertisement';
COMMENT ON COLUMN ad_submissions.duration IS 'Duration of the ad campaign';
COMMENT ON COLUMN ad_submissions.start_date IS 'Preferred start date for the campaign';
COMMENT ON COLUMN ad_submissions.website IS 'Website URL (optional)';
COMMENT ON COLUMN ad_submissions.additional_info IS 'Additional information from the submitter';
COMMENT ON COLUMN ad_submissions.terms_accepted IS 'Whether the submitter accepted the terms and conditions';
COMMENT ON COLUMN ad_submissions.attachment_urls IS 'Array of URLs for uploaded attachments';
COMMENT ON COLUMN ad_submissions.status IS 'Current status of the submission (pending, under-review, approved, rejected, published)';
COMMENT ON COLUMN ad_submissions.payment_status IS 'Payment status (pending, paid, failed, refunded)';
COMMENT ON COLUMN ad_submissions.payment_reference IS 'Reference for the payment transaction';
COMMENT ON COLUMN ad_submissions.payment_amount IS 'Amount paid for the advertisement';
COMMENT ON COLUMN ad_submissions.payment_date IS 'Date when payment was made';
COMMENT ON COLUMN ad_submissions.admin_notes IS 'Notes added by admin during review';
COMMENT ON COLUMN ad_submissions.created_at IS 'Timestamp when the submission was created';
COMMENT ON COLUMN ad_submissions.updated_at IS 'Timestamp when the submission was last updated';
