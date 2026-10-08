-- Phase 1: Anonymous Confessions/Opinions

-- 1. ENUMs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'confession_type') THEN
        EXECUTE 'CREATE TYPE public.confession_type AS ENUM (''confession'', ''opinion'')';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'confession_category') THEN
        EXECUTE 'CREATE TYPE public.confession_category AS ENUM (''academics'', ''campus_life'', ''relationships'', ''humor'', ''serious_support'', ''other'')';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'confession_screening_flag') THEN
        EXECUTE 'CREATE TYPE public.confession_screening_flag AS ENUM (''none'', ''hate_speech'', ''threat'', ''self_harm'', ''contact_info'', ''name_pattern'')';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'confession_status') THEN
        EXECUTE 'CREATE TYPE public.confession_status AS ENUM (''pending_review'', ''published'', ''rejected'', ''hidden_pending_review'', ''removed'', ''archived'')';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'confession_reaction_type') THEN
        EXECUTE 'CREATE TYPE public.confession_reaction_type AS ENUM (''relate'', ''support'', ''funny'')';
    END IF;
END $$;

-- Extend report_reason ENUM
ALTER TYPE public.report_reason ADD VALUE IF NOT EXISTS 'self_harm';
ALTER TYPE public.report_reason ADD VALUE IF NOT EXISTS 'threat_of_violence';
ALTER TYPE public.report_reason ADD VALUE IF NOT EXISTS 'identifies_person';

-- 2. Add unmask permission to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_unmask_anonymous_posts boolean NOT NULL DEFAULT false;

-- 3. Create tables
CREATE TABLE IF NOT EXISTS public.confession_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    type public.confession_type NOT NULL,
    category public.confession_category NOT NULL,
    body_text text NOT NULL CHECK (char_length(body_text) <= 500),
    acknowledgment_confirmed boolean NOT NULL CHECK (acknowledgment_confirmed = true),
    screening_flag public.confession_screening_flag DEFAULT 'none',
    status public.confession_status NOT NULL DEFAULT 'pending_review',
    reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at timestamptz,
    published_at timestamptz,
    archived_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.confession_reactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES public.confession_posts(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    reaction_type public.confession_reaction_type NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE (post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.confession_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confession_reactions ENABLE ROW LEVEL SECURITY;

-- 4. Policies for confession_posts

-- Public can view published posts
CREATE POLICY "Public can view published posts" ON public.confession_posts
    FOR SELECT
    USING (status = 'published');

-- Submitters can view their own posts (to see status)
CREATE POLICY "Submitters can view their own posts" ON public.confession_posts
    FOR SELECT
    USING (auth.uid() = author_id);

-- Admins can view all posts (except maybe archived, but we'll let admin see all)
CREATE POLICY "Admins can view all posts" ON public.confession_posts
    FOR SELECT
    USING (public.is_admin());

-- Authenticated users can insert posts
CREATE POLICY "Authenticated users can create posts" ON public.confession_posts
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = author_id);

-- Admins can update post status (approve, reject, remove)
CREATE POLICY "Admins can update posts" ON public.confession_posts
    FOR UPDATE
    USING (public.is_admin());

-- 5. Policies for confession_reactions

-- Anyone can read reactions (app will aggregate)
CREATE POLICY "Public can view reactions" ON public.confession_reactions
    FOR SELECT
    USING (true);

-- Authenticated users can react
CREATE POLICY "Users can add reactions" ON public.confession_reactions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can remove their own reactions (though PRD says no update/delete in Phase 1, delete is standard for reactions)
CREATE POLICY "Users can remove their own reactions" ON public.confession_reactions
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 6. Trigger for updated_at
CREATE TRIGGER handle_updated_at_confession_posts
  BEFORE UPDATE ON public.confession_posts
  FOR EACH ROW 
  EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
