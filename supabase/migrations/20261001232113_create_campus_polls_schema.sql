-- Campus Polls Schema (Phase 1)
CREATE SCHEMA IF NOT EXISTS polls;

-- Enums
CREATE TYPE polls.poll_category AS ENUM ('academics', 'campus_life', 'events', 'sports', 'opinion');
CREATE TYPE polls.poll_status AS ENUM ('draft', 'published', 'closed');
CREATE TYPE polls.poll_visibility AS ENUM ('always', 'after_vote', 'after_close');

-- 1. Polls Table
CREATE TABLE IF NOT EXISTS polls.polls (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    question text NOT NULL,
    category polls.poll_category NOT NULL,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    status polls.poll_status NOT NULL DEFAULT 'draft',
    results_visibility polls.poll_visibility NOT NULL DEFAULT 'always',
    expires_at timestamptz,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Poll Options Table
CREATE TABLE IF NOT EXISTS polls.poll_options (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id uuid NOT NULL REFERENCES polls.polls(id) ON DELETE CASCADE,
    label text NOT NULL,
    sort_order int NOT NULL DEFAULT 0,
    vote_count int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Poll Votes Table
CREATE TABLE IF NOT EXISTS polls.poll_votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id uuid NOT NULL REFERENCES polls.polls(id) ON DELETE CASCADE,
    option_id uuid NOT NULL REFERENCES polls.poll_options(id) ON DELETE CASCADE,
    voter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(poll_id, voter_id)
);

-- Trigger Function: Validate option belongs to poll and increment vote count
CREATE OR REPLACE FUNCTION polls.process_poll_vote()
RETURNS TRIGGER AS $$
DECLARE
    actual_poll_id uuid;
BEGIN
    -- Validate that the option_id belongs to the poll_id provided
    SELECT poll_id INTO actual_poll_id FROM polls.poll_options WHERE id = NEW.option_id;
    IF actual_poll_id IS NULL OR actual_poll_id != NEW.poll_id THEN
        RAISE EXCEPTION 'Option does not belong to the specified poll';
    END IF;

    -- Increment the vote count
    UPDATE polls.poll_options
    SET vote_count = vote_count + 1
    WHERE id = NEW.option_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER process_poll_vote_trigger
AFTER INSERT ON polls.poll_votes
FOR EACH ROW
EXECUTE FUNCTION polls.process_poll_vote();


-- Row Level Security (RLS)

-- Enable RLS
ALTER TABLE polls.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls.poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS: polls
-- Public can read published or closed polls
CREATE POLICY "Public can view published or closed polls" ON polls.polls
    FOR SELECT USING (status = 'published' OR status = 'closed');

-- Admins can do everything on polls
CREATE POLICY "Admins have full access to polls" ON polls.polls
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS: poll_options
-- Public can read options. 
-- Note: Obfuscation of vote_count based on results_visibility is handled at the application layer as per design.
CREATE POLICY "Public can view poll options" ON polls.poll_options
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM polls.polls WHERE id = polls.poll_options.poll_id AND (status = 'published' OR status = 'closed'))
    );

-- Admins can do everything on options
CREATE POLICY "Admins have full access to poll options" ON polls.poll_options
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS: poll_votes
-- Users can read their own votes
CREATE POLICY "Users can view their own votes" ON polls.poll_votes
    FOR SELECT USING (auth.uid() = voter_id);

-- Admins can read all votes (but App layer will only query aggregate counts)
CREATE POLICY "Admins can view all votes" ON polls.poll_votes
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Users can insert their own vote
CREATE POLICY "Users can vote" ON polls.poll_votes
    FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- Expose polls schema to API
GRANT USAGE ON SCHEMA polls TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA polls TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA polls TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA polls TO anon, authenticated;
