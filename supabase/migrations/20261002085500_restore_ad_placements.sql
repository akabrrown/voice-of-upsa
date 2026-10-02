-- Restore original ad placements using the existing ad_type column

DO $$ 
BEGIN
    -- If the database uses 'ad_type' for placement, we can just sync it directly to the new 'ad_placement' column
    UPDATE public.advertisements 
    SET ad_placement = ad_type;

EXCEPTION WHEN undefined_column THEN
    -- If neither exists in the way we expect, do nothing to avoid breaking further
    RAISE NOTICE 'ad_type column not found, skipping sync.';
END $$;
