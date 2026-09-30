-- Step 1a: Student Services Directory
-- Creating the directory schema, tables, and RLS policies.

CREATE SCHEMA IF NOT EXISTS directory;

-- ENUMs
CREATE TYPE directory.service_status AS ENUM ('active', 'inactive');

-- 1. service_categories
CREATE TABLE IF NOT EXISTS directory.service_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    sort_order int DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. services
CREATE TABLE IF NOT EXISTS directory.services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    category_id uuid REFERENCES directory.service_categories(id) ON DELETE RESTRICT,
    name text NOT NULL,
    description text,
    location_label text,
    contact_phone text,
    contact_email text,
    contact_whatsapp text,
    website_url text,
    hours jsonb DEFAULT '{}'::jsonb,
    logo_url text,
    is_featured boolean DEFAULT false,
    status directory.service_status DEFAULT 'inactive',
    last_verified_at timestamptz DEFAULT now(),
    verified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B')
    ) STORED,
    deleted_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create a GIN index on search_vector
CREATE INDEX IF NOT EXISTS services_search_idx ON directory.services USING GIN (search_vector);

-- Enable RLS
ALTER TABLE directory.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory.services ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin (already exists in public, but making sure we can use it)
-- We use: EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)

-- RLS for service_categories
-- Public read if active, Admin reads all
CREATE POLICY "Public can view active categories" ON directory.service_categories
    FOR SELECT USING (is_active = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Admin can insert/update/delete categories
CREATE POLICY "Admins can manage categories" ON directory.service_categories
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- RLS for services
-- Public read if active and not deleted, Admin reads all
CREATE POLICY "Public can view active services" ON directory.services
    FOR SELECT USING (
        (status = 'active' AND deleted_at IS NULL)
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- Admin can insert/update/delete services
CREATE POLICY "Admins can manage services" ON directory.services
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Seed some initial categories as mentioned in PRD
INSERT INTO directory.service_categories (name, slug, sort_order) VALUES
('Health & Wellness', 'health-wellness', 1),
('Academic Support', 'academic-support', 2),
('Financial Aid', 'financial-aid', 3),
('Careers & Internships', 'careers-internships', 4),
('IT & Tech Support', 'it-tech-support', 5),
('Security & Safety', 'security-safety', 6),
('Housing & Hostel', 'housing-hostel', 7),
('Clubs & Societies', 'clubs-societies', 8),
('Administrative', 'administrative', 9),
('Other', 'other', 10)
ON CONFLICT (slug) DO NOTHING;
