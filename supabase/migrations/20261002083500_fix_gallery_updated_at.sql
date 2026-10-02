-- Safe fallback to ensure updated_at exists and triggers are properly set

DO $$ 
BEGIN
    -- Ensure gallery_albums has updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gallery_albums' AND column_name = 'updated_at') THEN
        ALTER TABLE public.gallery_albums ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;

    -- Ensure gallery_photos has updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gallery_photos' AND column_name = 'updated_at') THEN
        ALTER TABLE public.gallery_photos ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- Trigger Function for gallery_albums
CREATE OR REPLACE FUNCTION update_gallery_albums_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_gallery_albums_updated_at ON public.gallery_albums;
CREATE TRIGGER update_gallery_albums_updated_at
    BEFORE UPDATE ON public.gallery_albums
    FOR EACH ROW
    EXECUTE FUNCTION update_gallery_albums_updated_at();

-- Trigger Function for gallery_photos
CREATE OR REPLACE FUNCTION update_gallery_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_gallery_photos_updated_at ON public.gallery_photos;
CREATE TRIGGER update_gallery_photos_updated_at
    BEFORE UPDATE ON public.gallery_photos
    FOR EACH ROW
    EXECUTE FUNCTION update_gallery_photos_updated_at();
