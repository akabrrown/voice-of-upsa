-- Create advertisements table
CREATE TABLE IF NOT EXISTS advertisements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    ad_tier TEXT NOT NULL CHECK (ad_tier IN ('basic', 'standard', 'premium')),
    banner_image_url TEXT,
    target_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'completed')),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;

-- Public can read active ads
DROP POLICY IF EXISTS "Public can view active ads" ON advertisements;
CREATE POLICY "Public can view active ads" 
    ON advertisements FOR SELECT 
    USING (status = 'active');

-- Public (unauthenticated) can insert new ad requests
DROP POLICY IF EXISTS "Anyone can submit ad requests" ON advertisements;
CREATE POLICY "Anyone can submit ad requests" 
    ON advertisements FOR INSERT 
    WITH CHECK (true);

-- Admins can do everything
DROP POLICY IF EXISTS "Admins can manage all ads" ON advertisements;
CREATE POLICY "Admins can manage all ads" 
    ON advertisements FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Updated_at Trigger
CREATE OR REPLACE FUNCTION update_advertisements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_advertisements_updated_at ON advertisements;
CREATE TRIGGER update_advertisements_updated_at
    BEFORE UPDATE ON advertisements
    FOR EACH ROW
    EXECUTE FUNCTION update_advertisements_updated_at();
