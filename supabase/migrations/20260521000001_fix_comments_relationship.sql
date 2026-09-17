-- Fix relationship between comments/reactions and profiles for PostgREST joins

-- 1. Alter comments table constraint to reference public.profiles(id)
ALTER TABLE public.comments 
    DROP CONSTRAINT IF EXISTS comments_user_id_fkey,
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Alter article_reactions table constraint (if it exists and references auth.users) to reference public.profiles(id)
ALTER TABLE public.article_reactions
    DROP CONSTRAINT IF EXISTS article_reactions_user_id_fkey,
    ADD CONSTRAINT article_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
