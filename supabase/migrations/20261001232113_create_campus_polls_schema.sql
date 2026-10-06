-- Campus Polls Schema (Phase 1) — all tables in public schema with polls_ prefix

-- Enums (idempotent)
DO $$ BEGIN
  CREATE TYPE public.poll_category AS ENUM ('academics', 'campus_life', 'events', 'sports', 'opinion');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.poll_status AS ENUM ('draft', 'published', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.poll_visibility AS ENUM ('always', 'after_vote', 'after_close');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 1. Polls Table
CREATE TABLE IF NOT EXISTS public.polls (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    question text NOT NULL,
    category public.poll_category NOT NULL,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    status public.poll_status NOT NULL DEFAULT 'draft',
    results_visibility public.poll_visibility NOT NULL DEFAULT 'always',
    expires_at timestamptz,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Poll Options Table
CREATE TABLE IF NOT EXISTS public.poll_options (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    label text NOT NULL,
    sort_order int NOT NULL DEFAULT 0,
    vote_count int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Poll Votes Table (voter_id is private — RLS exposes only own row)
CREATE TABLE IF NOT EXISTS public.poll_votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    option_id uuid NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
    voter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(poll_id, voter_id)
);

-- Trigger Function: Validate option belongs to poll and increment vote count atomically
CREATE OR REPLACE FUNCTION public.process_poll_vote()
RETURNS TRIGGER AS $$
DECLARE
    actual_poll_id uuid;
BEGIN
    SELECT poll_id INTO actual_poll_id FROM public.poll_options WHERE id = NEW.option_id;
    IF actual_poll_id IS NULL OR actual_poll_id != NEW.poll_id THEN
        RAISE EXCEPTION 'Option does not belong to the specified poll';
    END IF;
    UPDATE public.poll_options
    SET vote_count = vote_count + 1
    WHERE id = NEW.option_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS process_poll_vote_trigger ON public.poll_votes;
CREATE TRIGGER process_poll_vote_trigger
AFTER INSERT ON public.poll_votes
FOR EACH ROW
EXECUTE FUNCTION public.process_poll_vote();

-- Row Level Security
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS: polls
DROP POLICY IF EXISTS "Public can view published or closed polls" ON public.polls;
CREATE POLICY "Public can view published or closed polls" ON public.polls
    FOR SELECT USING (status = 'published' OR status = 'closed');

DROP POLICY IF EXISTS "Admins and Editors have full access to polls" ON public.polls;
CREATE POLICY "Admins and Editors have full access to polls" ON public.polls
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    );

-- RLS: poll_options
DROP POLICY IF EXISTS "Public can view poll options" ON public.poll_options;
CREATE POLICY "Public can view poll options" ON public.poll_options
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.polls WHERE id = public.poll_options.poll_id AND (status = 'published' OR status = 'closed'))
    );

DROP POLICY IF EXISTS "Admins and Editors have full access to poll options" ON public.poll_options;
CREATE POLICY "Admins and Editors have full access to poll options" ON public.poll_options
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    );

-- RLS: poll_votes
DROP POLICY IF EXISTS "Users can view their own votes" ON public.poll_votes;
CREATE POLICY "Users can view their own votes" ON public.poll_votes
    FOR SELECT USING (auth.uid() = voter_id);

DROP POLICY IF EXISTS "Admins and Editors can view all votes" ON public.poll_votes;
CREATE POLICY "Admins and Editors can view all votes" ON public.poll_votes
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    );

DROP POLICY IF EXISTS "Users can vote" ON public.poll_votes;
CREATE POLICY "Users can vote" ON public.poll_votes
    FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- Enable Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'polls'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.polls;
  END IF;
END $$;
