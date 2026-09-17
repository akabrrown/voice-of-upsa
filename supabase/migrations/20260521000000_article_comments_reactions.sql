-- 1. Create Article Reactions Table
CREATE TABLE IF NOT EXISTS public.article_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'insightful', 'wow', 'sad')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (article_id, user_id)
);

-- 2. Enable RLS
ALTER TABLE public.article_reactions ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies for Reactions
DROP POLICY IF EXISTS "Anyone can view article reactions" ON public.article_reactions;
CREATE POLICY "Anyone can view article reactions" ON public.article_reactions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert reactions" ON public.article_reactions;
CREATE POLICY "Authenticated users can insert reactions" ON public.article_reactions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reactions" ON public.article_reactions;
CREATE POLICY "Users can update own reactions" ON public.article_reactions
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reactions" ON public.article_reactions;
CREATE POLICY "Users can delete own reactions" ON public.article_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Add product_name and product_description to advertisements table
ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS product_description TEXT;

-- 5. Add RLS Policies for Advertisements (since they were missing!)
DROP POLICY IF EXISTS "Users can insert own advertisements" ON public.advertisements;
CREATE POLICY "Users can insert own advertisements" ON public.advertisements
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = submitted_by);

DROP POLICY IF EXISTS "Users can view own advertisements" ON public.advertisements;
CREATE POLICY "Users can view own advertisements" ON public.advertisements
    FOR SELECT USING (
        auth.uid() = submitted_by OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    );

DROP POLICY IF EXISTS "Admins can update advertisements" ON public.advertisements;
CREATE POLICY "Admins can update advertisements" ON public.advertisements
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Admins can delete advertisements" ON public.advertisements;
CREATE POLICY "Admins can delete advertisements" ON public.advertisements
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 6. Link comments table user_id to public.profiles(id) for PostgREST relationship detection
ALTER TABLE public.comments 
    DROP CONSTRAINT IF EXISTS comments_user_id_fkey,
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

