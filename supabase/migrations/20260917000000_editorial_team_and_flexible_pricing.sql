-- Migration: Editorial Team CMS & Flexible Advertising Pricing Plans
-- Date: 2026-09-17

-- 1. Create Editorial Team Table
CREATE TABLE IF NOT EXISTS public.editorial_team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    bio TEXT,
    image_url TEXT,
    email TEXT,
    social_links JSONB DEFAULT '{}'::jsonb,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for editorial_team
ALTER TABLE public.editorial_team ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view active editorial team members" ON public.editorial_team;
DROP POLICY IF EXISTS "Admins can manage editorial team members" ON public.editorial_team;

-- Policies for editorial_team
CREATE POLICY "Anyone can view active editorial team members" ON public.editorial_team
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage editorial team members" ON public.editorial_team
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Seed initial team members if table is empty
INSERT INTO public.editorial_team (name, role, bio, image_url, display_order, is_active)
SELECT 'Dr. Kwesi Amponsah', 'Editor-in-Chief', 'Supervising editorial direction, journalistic ethics, and digital publication strategy.', '/logo.jpg', 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.editorial_team WHERE name = 'Dr. Kwesi Amponsah');

INSERT INTO public.editorial_team (name, role, bio, image_url, display_order, is_active)
SELECT 'Sarah Mensah', 'Managing Editor', 'Directing newsroom operations, investigative reporting desks, and campus outreach.', '/logo.jpg', 2, true
WHERE NOT EXISTS (SELECT 1 FROM public.editorial_team WHERE name = 'Sarah Mensah');

INSERT INTO public.editorial_team (name, role, bio, image_url, display_order, is_active)
SELECT 'Isaac Osei', 'Digital Content Lead', 'Leading multimedia production, data storytelling, and digital channel engagement.', '/logo.jpg', 3, true
WHERE NOT EXISTS (SELECT 1 FROM public.editorial_team WHERE name = 'Isaac Osei');

INSERT INTO public.editorial_team (name, role, bio, image_url, display_order, is_active)
SELECT 'Grace Appiah', 'Lead Reporter', 'Covering student council affairs, academic achievements, and campus development news.', '/logo.jpg', 4, true
WHERE NOT EXISTS (SELECT 1 FROM public.editorial_team WHERE name = 'Grace Appiah');

-- 2. Extend Pricing Tiers Table to allow custom plans & admin edits
-- Safely drop the restrictive check constraint if present
DO $$
BEGIN
    ALTER TABLE public.pricing_tiers DROP CONSTRAINT IF EXISTS pricing_tiers_id_check;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Add flexible columns to pricing_tiers if not exist
ALTER TABLE public.pricing_tiers 
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS highlight BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS button_text TEXT DEFAULT 'Start Advertising',
    ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Drop and recreate comprehensive Admin policies for pricing_tiers
DROP POLICY IF EXISTS "Admins can insert pricing tiers" ON public.pricing_tiers;
DROP POLICY IF EXISTS "Admins can update pricing tiers" ON public.pricing_tiers;
DROP POLICY IF EXISTS "Admins can delete pricing tiers" ON public.pricing_tiers;

CREATE POLICY "Admins can insert pricing tiers" ON public.pricing_tiers
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can update pricing tiers" ON public.pricing_tiers
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can delete pricing tiers" ON public.pricing_tiers
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Seed/Update rich tier details for default tiers
UPDATE public.pricing_tiers
SET 
    name = 'Basic',
    description = 'Perfect for student-led initiatives and campus clubs.',
    features = '["Sidebar Ad (300x250)", "Standard Placement", "Basic Analytics", "Up to 10,000 Impressions"]'::jsonb,
    highlight = false,
    button_text = 'Start Advertising',
    sort_order = 1,
    is_active = true
WHERE id = 'basic';

UPDATE public.pricing_tiers
SET 
    name = 'Standard',
    description = 'Ideal for small businesses and service providers.',
    features = '["Leaderboard Ad (728x90)", "Premium Sidebar Placement", "In-feed Native Ad", "Detailed Analytics Report", "Up to 50,000 Impressions"]'::jsonb,
    highlight = true,
    button_text = 'Most Popular',
    sort_order = 2,
    is_active = true
WHERE id = 'standard';

UPDATE public.pricing_tiers
SET 
    name = 'Premium',
    description = 'Maximum exposure for corporate partners and brands.',
    features = '["All Standard Features", "Home Page Hero Banner", "Social Media Mention", "Article Sponsorship", "Unlimited Impressions", "Dedicated Account Manager"]'::jsonb,
    highlight = false,
    button_text = 'Contact for Custom',
    sort_order = 3,
    is_active = true
WHERE id = 'premium';
