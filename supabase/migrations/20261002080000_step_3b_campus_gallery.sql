-- Step 3b: Campus Gallery
-- Creating the tables and RLS policies in the public schema to avoid PostgREST exposed schema issues.

-- ENUMs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gallery_album_category') THEN
        EXECUTE 'CREATE TYPE public.gallery_album_category AS ENUM (''events'', ''sports'', ''academics'', ''campus_life'', ''clubs_societies'')';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gallery_album_status') THEN
        EXECUTE 'CREATE TYPE public.gallery_album_status AS ENUM (''draft'', ''published'')';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gallery_photo_source') THEN
        EXECUTE 'CREATE TYPE public.gallery_photo_source AS ENUM (''admin'', ''submission'')';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gallery_photo_status') THEN
        EXECUTE 'CREATE TYPE public.gallery_photo_status AS ENUM (''pending_review'', ''approved'', ''rejected'', ''withdrawn'')';
    END IF;
END $$;

-- 1. gallery_albums
CREATE TABLE IF NOT EXISTS public.gallery_albums (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    title text NOT NULL,
    description text,
    category public.gallery_album_category NOT NULL,
    event_date date,
    cover_photo_id uuid, -- FK added after photos table creation
    submissions_open boolean DEFAULT false,
    status public.gallery_album_status DEFAULT 'draft',
    is_featured boolean DEFAULT false,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. gallery_photos
CREATE TABLE IF NOT EXISTS public.gallery_photos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    album_id uuid REFERENCES public.gallery_albums(id) ON DELETE CASCADE,
    image_url text NOT NULL,
    caption text,
    source public.gallery_photo_source NOT NULL,
    submitted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    consent_confirmed boolean DEFAULT false,
    status public.gallery_photo_status DEFAULT 'pending_review',
    sort_order int DEFAULT 0,
    deleted_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add cover_photo_id FK to gallery_albums
ALTER TABLE public.gallery_albums 
    DROP CONSTRAINT IF EXISTS gallery_albums_cover_photo_id_fkey;

ALTER TABLE public.gallery_albums 
    ADD CONSTRAINT gallery_albums_cover_photo_id_fkey 
    FOREIGN KEY (cover_photo_id) 
    REFERENCES public.gallery_photos(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.gallery_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gallery_albums
DROP POLICY IF EXISTS "Public can view published albums" ON public.gallery_albums;
CREATE POLICY "Public can view published albums" ON public.gallery_albums
    FOR SELECT USING (status = 'published' AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Admins can do everything on albums" ON public.gallery_albums;
CREATE POLICY "Admins can do everything on albums" ON public.gallery_albums
    USING (public.is_admin());

-- RLS Policies for gallery_photos
DROP POLICY IF EXISTS "Public can view approved photos" ON public.gallery_photos;
CREATE POLICY "Public can view approved photos" ON public.gallery_photos
    FOR SELECT USING (status = 'approved' AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Submitters can view their own photos regardless of status" ON public.gallery_photos;
CREATE POLICY "Submitters can view their own photos regardless of status" ON public.gallery_photos
    FOR SELECT USING (submitted_by = auth.uid());

DROP POLICY IF EXISTS "Signed in users can submit photos if album is open" ON public.gallery_photos;
CREATE POLICY "Signed in users can submit photos if album is open" ON public.gallery_photos
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        source = 'submission' AND
        status = 'pending_review' AND
        EXISTS (
            SELECT 1 FROM public.gallery_albums 
            WHERE id = album_id AND submissions_open = true AND deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "Submitters can withdraw their pending photos" ON public.gallery_photos;
CREATE POLICY "Submitters can withdraw their pending photos" ON public.gallery_photos
    FOR UPDATE USING (
        submitted_by = auth.uid() AND 
        status = 'pending_review'
    ) WITH CHECK (
        status = 'withdrawn'
    );

DROP POLICY IF EXISTS "Admins can do everything on photos" ON public.gallery_photos;
CREATE POLICY "Admins can do everything on photos" ON public.gallery_photos
    USING (public.is_admin());

-- Realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery_albums;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery_photos;
