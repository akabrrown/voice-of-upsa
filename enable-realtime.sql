-- Enable Realtime for articles table (ignore if already enabled)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.articles;
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'articles table is already enabled for realtime';
END $$;

-- Enable Realtime for reactions table (ignore if already enabled)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'reactions table is already enabled for realtime';
END $$;

-- Enable Realtime for comments table (ignore if already enabled) - for future use
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'comments table is already enabled for realtime';
END $$;

-- Verify the publication
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
