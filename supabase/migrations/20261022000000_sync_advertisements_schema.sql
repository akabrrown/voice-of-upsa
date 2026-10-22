-- Migration: Synchronize advertisements schema
-- Resolves: "Could not find the 'ad_tier' column of 'advertisements' in the schema cache"
-- Ensures complete backward and forward compatibility between legacy and new advertisements schema.

-- 1. Safely add missing columns using PostgreSQL native IF NOT EXISTS
ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS ad_tier TEXT;
ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS package_tier TEXT;
ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS banner_image_url TEXT;
ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS creative_url TEXT;
ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS ad_placement TEXT DEFAULT 'sidebar';
ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS ad_type TEXT DEFAULT 'sidebar';
ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;
ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;
ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;
ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS product_description TEXT;
ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Data backfilling and constraint adjustments
DO $$
BEGIN
    -- Backfill ad_tier from package_tier and vice versa
    UPDATE public.advertisements 
    SET ad_tier = package_tier 
    WHERE ad_tier IS NULL AND package_tier IS NOT NULL;

    UPDATE public.advertisements 
    SET package_tier = ad_tier 
    WHERE package_tier IS NULL AND ad_tier IS NOT NULL;

    -- Backfill banner_image_url and creative_url
    UPDATE public.advertisements 
    SET banner_image_url = creative_url 
    WHERE banner_image_url IS NULL AND creative_url IS NOT NULL;

    UPDATE public.advertisements 
    SET creative_url = banner_image_url 
    WHERE creative_url IS NULL AND banner_image_url IS NOT NULL;

    -- Backfill ad_placement and ad_type
    UPDATE public.advertisements 
    SET ad_placement = ad_type 
    WHERE ad_placement IS NULL AND ad_type IS NOT NULL;

    UPDATE public.advertisements 
    SET ad_type = ad_placement 
    WHERE ad_type IS NULL AND ad_placement IS NOT NULL;

    -- Backfill dates
    UPDATE public.advertisements 
    SET start_date = starts_at 
    WHERE start_date IS NULL AND starts_at IS NOT NULL;

    UPDATE public.advertisements 
    SET starts_at = start_date 
    WHERE starts_at IS NULL AND start_date IS NOT NULL;

    UPDATE public.advertisements 
    SET end_date = ends_at 
    WHERE end_date IS NULL AND ends_at IS NOT NULL;

    UPDATE public.advertisements 
    SET ends_at = end_date 
    WHERE ends_at IS NULL AND end_date IS NOT NULL;

    -- Make 'contact_name' optional if column exists and is not null
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'advertisements' 
          AND column_name = 'contact_name'
    ) THEN
        ALTER TABLE public.advertisements ALTER COLUMN contact_name DROP NOT NULL;
    END IF;

    -- Relax status check constraint to support all valid statuses
    ALTER TABLE public.advertisements DROP CONSTRAINT IF EXISTS advertisements_status_check;
    ALTER TABLE public.advertisements 
        ADD CONSTRAINT advertisements_status_check 
        CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'expired', 'completed'));

END $$;

-- 3. Auto-synchronization trigger to maintain dual-column compatibility on future writes
CREATE OR REPLACE FUNCTION public.sync_advertisements_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync tier columns
    IF NEW.ad_tier IS NOT NULL AND NEW.package_tier IS NULL THEN
        NEW.package_tier := NEW.ad_tier;
    ELSIF NEW.package_tier IS NOT NULL AND NEW.ad_tier IS NULL THEN
        NEW.ad_tier := NEW.package_tier;
    END IF;

    -- Sync creative/banner columns
    IF NEW.banner_image_url IS NOT NULL AND NEW.creative_url IS NULL THEN
        NEW.creative_url := NEW.banner_image_url;
    ELSIF NEW.creative_url IS NOT NULL AND NEW.banner_image_url IS NULL THEN
        NEW.banner_image_url := NEW.creative_url;
    END IF;

    -- Sync placement/type columns
    IF NEW.ad_placement IS NOT NULL AND NEW.ad_type IS NULL THEN
        NEW.ad_type := NEW.ad_placement;
    ELSIF NEW.ad_type IS NOT NULL AND NEW.ad_placement IS NULL THEN
        NEW.ad_placement := NEW.ad_type;
    END IF;

    -- Sync date columns
    IF NEW.start_date IS NOT NULL AND NEW.starts_at IS NULL THEN
        NEW.starts_at := NEW.start_date;
    ELSIF NEW.starts_at IS NOT NULL AND NEW.start_date IS NULL THEN
        NEW.start_date := NEW.starts_at;
    END IF;

    IF NEW.end_date IS NOT NULL AND NEW.ends_at IS NULL THEN
        NEW.ends_at := NEW.end_date;
    ELSIF NEW.ends_at IS NOT NULL AND NEW.end_date IS NULL THEN
        NEW.end_date := NEW.ends_at;
    END IF;

    -- Default contact_name if column exists and value is omitted
    IF NEW.contact_name IS NULL OR NEW.contact_name = '' THEN
        NEW.contact_name := COALESCE(NEW.company_name, 'Advertiser');
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_advertisements_columns ON public.advertisements;
CREATE TRIGGER trg_sync_advertisements_columns
    BEFORE INSERT OR UPDATE ON public.advertisements
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_advertisements_columns();

-- 4. Signal PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
