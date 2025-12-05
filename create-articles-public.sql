-- Create articles_public table without RLS restrictions
-- This table will be a copy of articles but accessible to anonymous users

-- Drop table if it exists (for testing)
DROP TABLE IF EXISTS articles_public;

-- Create the articles_public table
CREATE TABLE articles_public (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  author_id UUID, -- Removed foreign key constraint for now
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  bookmarks_count INTEGER DEFAULT 0,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_articles_public_status ON articles_public(status);
CREATE INDEX idx_articles_public_published_at ON articles_public(published_at DESC);
CREATE INDEX idx_articles_public_slug ON articles_public(slug);
CREATE INDEX idx_articles_public_author_id ON articles_public(author_id);

-- Enable RLS but create permissive policies
ALTER TABLE articles_public ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read published articles
CREATE POLICY "Enable read access for all users" ON articles_public
FOR SELECT USING (status = 'published');

-- Policy: Allow authenticated users to insert articles (for content creation)
CREATE POLICY "Enable insert for authenticated users" ON articles_public
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow article authors and admins to update
CREATE POLICY "Enable update for authors and admins" ON articles_public
FOR UPDATE USING (
  auth.uid() = author_id OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ) OR
  author_id IS NULL -- Allow updates on articles without authors
);

-- Policy: Allow article authors and admins to delete
CREATE POLICY "Enable delete for authors and admins" ON articles_public
FOR DELETE USING (
  auth.uid() = author_id OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ) OR
  author_id IS NULL -- Allow deletion of articles without authors
);

-- Grant permissions
GRANT SELECT ON articles_public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON articles_public TO authenticated;
GRANT ALL ON articles_public TO service_role;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_articles_public_updated_at 
BEFORE UPDATE ON articles_public 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Articles public table created successfully
-- Note: No sample data included - add data through the application interface
