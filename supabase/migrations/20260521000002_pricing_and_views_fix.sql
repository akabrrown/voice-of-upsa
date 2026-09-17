-- Migration: Pricing Tiers & Secure Article Views Increment Function

-- 1. Create Pricing Tiers Table
CREATE TABLE IF NOT EXISTS public.pricing_tiers (
    id TEXT PRIMARY KEY CHECK (id IN ('basic', 'standard', 'premium')),
    price NUMERIC NOT NULL,
    period TEXT NOT NULL DEFAULT 'per week',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view pricing tiers" ON public.pricing_tiers;
DROP POLICY IF EXISTS "Admins can update pricing tiers" ON public.pricing_tiers;

-- Create Policies
CREATE POLICY "Anyone can view pricing tiers" ON public.pricing_tiers
    FOR SELECT USING (true);

CREATE POLICY "Admins can update pricing tiers" ON public.pricing_tiers
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Insert Initial Values
INSERT INTO public.pricing_tiers (id, price, period) VALUES
    ('basic', 200, 'per week'),
    ('standard', 500, 'per week'),
    ('premium', 1200, 'per week')
ON CONFLICT (id) DO NOTHING;

-- 2. Create security definer RPC function to increment article view count safely bypassing RLS
CREATE OR REPLACE FUNCTION public.increment_article_view(target_article_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.articles
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = target_article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
