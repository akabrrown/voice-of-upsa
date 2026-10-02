-- Add ad_placement to advertisements

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'advertisements' AND column_name = 'ad_placement') THEN
        ALTER TABLE public.advertisements 
        ADD COLUMN ad_placement TEXT NOT NULL DEFAULT 'sidebar' CHECK (ad_placement IN ('leaderboard', 'sidebar', 'in-feed'));
    END IF;
END $$;
