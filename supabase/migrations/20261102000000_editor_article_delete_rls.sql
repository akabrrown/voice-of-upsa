-- Migration: Allow editors to delete articles without admin approval
-- Timestamp: 20261102000000
-- Target Project: Voice of UPSA (public.articles)

SET search_path = public, auth;

-- Safety Guard: Ensure public.articles exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'articles'
    ) THEN
        RAISE EXCEPTION 'Target database does not have "public.articles".';
    END IF;
END $$;

-- Drop legacy/restrictive DELETE policies on public.articles
DROP POLICY IF EXISTS "Editors can delete own articles" ON public.articles;
DROP POLICY IF EXISTS "Editors can delete articles" ON public.articles;

-- Allow editors and admins to delete articles directly without admin approval.
-- Editors can delete articles they created/authored, articles they published, or any article if they have the editor role.
-- Admins retain full deletion capability.
CREATE POLICY "Editors can delete articles" ON public.articles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'editor')
        ) OR
        auth.uid() = author_id OR
        auth.uid() = publisher_id
    );
