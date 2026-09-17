-- Add DELETE policy for articles table
DROP POLICY IF EXISTS "Editors can delete own articles" ON public.articles;

CREATE POLICY "Editors can delete own articles" ON public.articles
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
        (auth.uid() = author_id AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'editor'))
    );
