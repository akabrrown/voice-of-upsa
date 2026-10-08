-- Migration: Create site_metrics table for analytics tracking

CREATE TABLE IF NOT EXISTS public.site_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('article', 'holiday', 'page')),
    entity_slug TEXT NOT NULL,
    views INTEGER NOT NULL DEFAULT 0,
    shares INTEGER NOT NULL DEFAULT 0,
    last_engaged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(entity_type, entity_slug)
);

-- Enable RLS
ALTER TABLE public.site_metrics ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read metrics (for showing view counts publicly if needed)
CREATE POLICY "Enable read access for all users" ON public.site_metrics FOR SELECT USING (true);

-- Create a function to atomically increment views or shares
CREATE OR REPLACE FUNCTION increment_metric(
    p_entity_type TEXT,
    p_entity_slug TEXT,
    p_metric_type TEXT -- 'view' or 'share'
) RETURNS void AS $$
BEGIN
    INSERT INTO public.site_metrics (entity_type, entity_slug, views, shares, last_engaged_at)
    VALUES (
        p_entity_type, 
        p_entity_slug, 
        CASE WHEN p_metric_type = 'view' THEN 1 ELSE 0 END,
        CASE WHEN p_metric_type = 'share' THEN 1 ELSE 0 END,
        now()
    )
    ON CONFLICT (entity_type, entity_slug) 
    DO UPDATE SET 
        views = site_metrics.views + CASE WHEN p_metric_type = 'view' THEN 1 ELSE 0 END,
        shares = site_metrics.shares + CASE WHEN p_metric_type = 'share' THEN 1 ELSE 0 END,
        last_engaged_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
