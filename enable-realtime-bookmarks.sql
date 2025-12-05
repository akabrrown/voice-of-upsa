-- Enable Realtime for bookmarks table
-- This allows clients to subscribe to bookmark changes in real-time

-- First, check if bookmarks table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create unique constraint to prevent duplicate bookmarks
CREATE UNIQUE INDEX IF NOT EXISTS bookmarks_article_user_unique 
ON public.bookmarks(article_id, user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS bookmarks_article_id_idx ON public.bookmarks(article_id);
CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx ON public.bookmarks(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Bookmarks are viewable by owner" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can create their own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.bookmarks;

-- Create RLS policies
-- Allow users to see their own bookmarks
CREATE POLICY "Bookmarks are viewable by owner" ON public.bookmarks
FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own bookmarks
CREATE POLICY "Users can create their own bookmarks" ON public.bookmarks
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks" ON public.bookmarks
FOR DELETE USING (auth.uid() = user_id);

-- Add bookmarks table to realtime publication
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks;
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'bookmarks table is already enabled for realtime';
END $$;

-- Create or replace the toggle_bookmark function
CREATE OR REPLACE FUNCTION public.toggle_bookmark(
  article_uuid UUID,
  user_uuid UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  bookmark_exists BOOLEAN;
BEGIN
  -- Check if bookmark exists
  SELECT EXISTS (
    SELECT 1 FROM public.bookmarks 
    WHERE article_id = article_uuid AND user_id = user_uuid
  ) INTO bookmark_exists;

  IF bookmark_exists THEN
    -- Delete the bookmark
    DELETE FROM public.bookmarks 
    WHERE article_id = article_uuid AND user_id = user_uuid;
    RETURN FALSE;
  ELSE
    -- Create the bookmark
    INSERT INTO public.bookmarks (article_id, user_id)
    VALUES (article_uuid, user_uuid);
    RETURN TRUE;
  END IF;
END;
$$;

-- Verify the publication
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
