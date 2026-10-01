
-- Reading History Table
CREATE TABLE IF NOT EXISTS public.reading_history (
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (profile_id, article_id)
);

ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reading history"
    ON public.reading_history FOR SELECT
    USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own reading history"
    ON public.reading_history FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own reading history"
    ON public.reading_history FOR UPDATE
    USING (auth.uid() = profile_id);
