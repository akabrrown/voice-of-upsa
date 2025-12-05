-- Fix reactions table to allow anonymous users
-- This removes the foreign key constraint and allows null user_id for anonymous reactions

-- Drop the foreign key constraint
ALTER TABLE public.reactions DROP CONSTRAINT IF EXISTS reactions_user_id_fkey;

-- Make user_id nullable to allow anonymous reactions
ALTER TABLE public.reactions ALTER COLUMN user_id DROP NOT NULL;

-- Drop the unique constraint and recreate it to handle null user_id
DROP INDEX IF EXISTS reactions_article_user_unique;

-- Create new unique constraint that allows multiple anonymous users per article
-- but still prevents duplicate reactions from the same user
CREATE UNIQUE INDEX IF NOT EXISTS reactions_article_user_unique 
ON public.reactions(article_id, user_id) WHERE user_id IS NOT NULL;

-- Update RLS policies to allow anonymous reactions
-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own reactions" ON public.reactions;
DROP POLICY IF EXISTS "Users can update their own reactions" ON public.reactions;
DROP POLICY IF EXISTS "Users can delete their own reactions" ON public.reactions;

-- Create new policies that allow anonymous reactions
CREATE POLICY "Users can create their own reactions" ON public.reactions
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR 
  (user_id IS NULL AND auth.uid() IS NULL)
);

CREATE POLICY "Users can update their own reactions" ON public.reactions
FOR UPDATE USING (
  auth.uid() = user_id OR 
  (user_id IS NULL AND auth.uid() IS NULL)
);

CREATE POLICY "Users can delete their own reactions" ON public.reactions
FOR DELETE USING (
  auth.uid() = user_id OR 
  (user_id IS NULL AND auth.uid() IS NULL)
);

-- Grant permissions
GRANT ALL ON reactions TO postgres;
GRANT ALL ON reactions TO authenticated;
GRANT ALL ON reactions TO service_role;
GRANT ALL ON reactions TO PUBLIC;
