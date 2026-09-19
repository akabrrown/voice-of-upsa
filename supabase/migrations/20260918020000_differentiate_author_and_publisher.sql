-- Migration: Differentiate Article Author vs Publisher
-- Timestamp: 20260918020000
-- Target Project: Voice of UPSA (pilncldxyzijalbuvdlh)

SET search_path = public, auth;

-- 0. Safety Guard: Verify target database is the Voice of UPSA project
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'articles'
    ) THEN
        RAISE EXCEPTION 'Target database does not have "public.articles". Verify you are connected to the Voice of UPSA database (Project ID: pilncldxyzijalbuvdlh at https://supabase.com/dashboard/project/pilncldxyzijalbuvdlh/sql/new)';
    END IF;
END $$;

-- 1. Add publisher_id, author_name, and author_title columns to public.articles
ALTER TABLE public.articles
    ADD COLUMN IF NOT EXISTS publisher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS author_name TEXT,
    ADD COLUMN IF NOT EXISTS author_title TEXT;

-- 2. Add performance indexes for foreign keys and queries
CREATE INDEX IF NOT EXISTS idx_articles_publisher_id ON public.articles(publisher_id);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON public.articles(author_id);

-- 3. Data backfill for existing published records (Preservation / Backward Compatibility)
-- For existing published articles where publisher_id is null, default publisher_id to author_id
-- (Captures the editor/staff member who originally uploaded and published the piece)
UPDATE public.articles
SET publisher_id = author_id
WHERE status = 'published' AND publisher_id IS NULL;

-- 4. Update strict Editor RLS Policies to account for publisher_id
-- Editors can insert articles with status 'draft' or 'review'
-- Admins can insert any status and specify author_id, author_name, and publisher_id
DROP POLICY IF EXISTS "Editors can insert own articles" ON public.articles;

CREATE POLICY "Editors can insert own articles" ON public.articles
    FOR INSERT WITH CHECK (
        (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')) OR
        (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'editor') AND 
            (status IS NULL OR status IN ('draft', 'review'))
        )
    );

-- Editors can update articles if they are the admin, author, or the assigned publisher/creator
DROP POLICY IF EXISTS "Editors can update own articles" ON public.articles;

CREATE POLICY "Editors can update own articles" ON public.articles
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
        (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'editor') AND
            (auth.uid() = author_id OR auth.uid() = publisher_id)
        )
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
        (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'editor') AND
            (auth.uid() = author_id OR auth.uid() = publisher_id) AND
            (
                status IN ('draft', 'review') OR 
                (status = 'published' AND public.get_article_status(id) = 'published')
            )
        )
    );
