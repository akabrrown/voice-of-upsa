-- Allow editors to publish directly
DROP POLICY IF EXISTS "Editors can insert own articles" ON public.articles;
DROP POLICY IF EXISTS "Editors can update own articles" ON public.articles;

CREATE POLICY "Editors can insert own articles" ON public.articles
    FOR INSERT WITH CHECK (
        (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')))
    );

CREATE POLICY "Editors can update own articles" ON public.articles
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
        (auth.uid() = author_id AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'editor'))
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
        (auth.uid() = author_id AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'editor'))
    );