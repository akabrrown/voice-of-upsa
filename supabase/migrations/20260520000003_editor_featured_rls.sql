-- Update articles RLS policy to allow editors to update their own published articles
-- as long as they do not change the status from or to 'published' (preserving the approval workflow)
DROP POLICY IF EXISTS "Editors can update own articles" ON public.articles;

CREATE POLICY "Editors can update own articles" ON public.articles
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
        (auth.uid() = author_id AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'editor'))
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
        (
            auth.uid() = author_id AND 
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'editor') AND 
            (
                status IN ('draft', 'review') OR 
                (status = 'published' AND (SELECT a.status FROM public.articles a WHERE a.id = id) = 'published')
            )
        )
    );
