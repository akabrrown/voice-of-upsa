-- Create reactions table for article reactions
CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('thumbsup', 'heart', 'smile', 'star', 'meh')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create unique constraint to prevent duplicate reactions
CREATE UNIQUE INDEX IF NOT EXISTS reactions_article_user_unique 
ON public.reactions(article_id, user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS reactions_article_id_idx ON public.reactions(article_id);
CREATE INDEX IF NOT EXISTS reactions_user_id_idx ON public.reactions(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow users to see all reactions for an article
CREATE POLICY "Reactions are viewable by everyone" ON public.reactions
FOR SELECT USING (true);

-- Allow users to insert their own reactions
CREATE POLICY "Users can create their own reactions" ON public.reactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own reactions
CREATE POLICY "Users can update their own reactions" ON public.reactions
FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own reactions
CREATE POLICY "Users can delete their own reactions" ON public.reactions
FOR DELETE USING (auth.uid() = user_id);

-- Allow admins to manage all reactions
CREATE POLICY "Admins can manage all reactions" ON public.reactions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);
