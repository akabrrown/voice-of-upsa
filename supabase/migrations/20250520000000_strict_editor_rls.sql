-- Strict Editor RLS Policies for articles table
-- Enforce review/approval workflow at the database level

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Editors can insert own articles" ON public.articles;
DROP POLICY IF EXISTS "Editors can update own articles" ON public.articles;

-- 2. Create strict insert policy
-- Editors can only insert articles with status 'draft' or 'review'.
-- Admins can insert any status.
CREATE POLICY "Editors can insert own articles" ON public.articles
    FOR INSERT WITH CHECK (
        (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')) OR
        (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'editor') AND (status IS NULL OR status IN ('draft', 'review')))
    );

-- 3. Create strict update policy
-- Editors can only update their own articles if they keep/change the status to 'draft' or 'review'.
-- Admins can update any article and change status to 'published' or 'archived'.
CREATE POLICY "Editors can update own articles" ON public.articles
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
        (auth.uid() = author_id AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'editor'))
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
        (auth.uid() = author_id AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'editor') AND status IN ('draft', 'review'))
    );
