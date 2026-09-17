-- 1. Create a security definer function to fetch the article status
-- This executes with owner privileges (bypassing RLS) and avoids infinite recursion loops.
CREATE OR REPLACE FUNCTION public.get_article_status(article_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT status FROM public.articles WHERE id = article_id;
$$;

-- 2. Drop and recreate the editor update policy using the helper function
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
                (status = 'published' AND public.get_article_status(id) = 'published')
            )
        )
    );
