-- Create article_views table to track unique views per user/visitor
CREATE TABLE IF NOT EXISTS public.article_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    visitor_id TEXT, -- For tracking guest users via cookies
    created_at TIMESTAMPTZ DEFAULT now(),
    -- Enforce unique views per user or per visitor session
    CONSTRAINT unique_user_article_view UNIQUE (article_id, user_id),
    CONSTRAINT unique_visitor_article_view UNIQUE (article_id, visitor_id),
    -- Ensure at least one identifying field is set
    CONSTRAINT check_visitor_or_user CHECK (
        (user_id IS NOT NULL AND visitor_id IS NULL) OR
        (user_id IS NULL AND visitor_id IS NOT NULL) OR
        (user_id IS NOT NULL AND visitor_id IS NOT NULL)
    )
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.article_views ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can insert article views" ON public.article_views;
DROP POLICY IF EXISTS "Admins and editors can view all views" ON public.article_views;

-- Create RLS Policies
CREATE POLICY "Anyone can insert article views" ON public.article_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins and editors can view all views" ON public.article_views
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('editor', 'admin'))
    );
