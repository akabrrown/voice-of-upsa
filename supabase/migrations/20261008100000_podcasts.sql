-- Phase 1: Podcasts Schema

-- 1. ENUMs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'podcast_category') THEN
        EXECUTE 'CREATE TYPE public.podcast_category AS ENUM (''campus_life'', ''academics'', ''interviews'', ''student_voices'', ''sports'', ''other'')';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'podcast_show_status') THEN
        EXECUTE 'CREATE TYPE public.podcast_show_status AS ENUM (''active'', ''inactive'')';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'podcast_episode_status') THEN
        EXECUTE 'CREATE TYPE public.podcast_episode_status AS ENUM (''draft'', ''published'')';
    END IF;
END $$;

-- 2. Create tables
CREATE TABLE IF NOT EXISTS public.podcast_shows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    category public.podcast_category NOT NULL,
    cover_image_url text NOT NULL,
    itunes_author text NOT NULL,
    itunes_explicit boolean NOT NULL DEFAULT false,
    status public.podcast_show_status NOT NULL DEFAULT 'active',
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.podcast_episodes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    show_id uuid REFERENCES public.podcast_shows(id) ON DELETE CASCADE,
    slug text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    episode_number int,
    season_number int,
    audio_url text NOT NULL,
    duration_seconds int NOT NULL,
    transcript text,
    status public.podcast_episode_status NOT NULL DEFAULT 'draft',
    published_at timestamptz,
    deleted_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (show_id, slug)
);

-- Enable RLS
ALTER TABLE public.podcast_shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.podcast_episodes ENABLE ROW LEVEL SECURITY;

-- 3. Policies for podcast_shows

-- Public can view active shows
CREATE POLICY "Public can view active shows" ON public.podcast_shows
    FOR SELECT
    USING (status = 'active' AND deleted_at IS NULL);

-- Admins can view all shows
CREATE POLICY "Admins can view all shows" ON public.podcast_shows
    FOR SELECT
    USING (public.is_admin());

-- Admins can insert shows
CREATE POLICY "Admins can create shows" ON public.podcast_shows
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin() AND auth.uid() = created_by);

-- Admins can update shows
CREATE POLICY "Admins can update shows" ON public.podcast_shows
    FOR UPDATE
    USING (public.is_admin());

-- 4. Policies for podcast_episodes

-- Public can view published episodes of active shows
CREATE POLICY "Public can view published episodes" ON public.podcast_episodes
    FOR SELECT
    USING (
        status = 'published' AND 
        deleted_at IS NULL AND
        EXISTS (
            SELECT 1 FROM public.podcast_shows s 
            WHERE s.id = podcast_episodes.show_id AND s.status = 'active' AND s.deleted_at IS NULL
        )
    );

-- Admins can view all episodes
CREATE POLICY "Admins can view all episodes" ON public.podcast_episodes
    FOR SELECT
    USING (public.is_admin());

-- Admins can insert episodes
CREATE POLICY "Admins can create episodes" ON public.podcast_episodes
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- Admins can update episodes
CREATE POLICY "Admins can update episodes" ON public.podcast_episodes
    FOR UPDATE
    USING (public.is_admin());

-- 5. Trigger for updated_at
CREATE TRIGGER handle_updated_at_podcast_shows
  BEFORE UPDATE ON public.podcast_shows
  FOR EACH ROW 
  EXECUTE PROCEDURE public.set_current_timestamp_updated_at();

CREATE TRIGGER handle_updated_at_podcast_episodes
  BEFORE UPDATE ON public.podcast_episodes
  FOR EACH ROW 
  EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
