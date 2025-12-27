-- Update articles_status_check constraint to include 'scheduled'
-- Usage: Run this in Supabase SQL Editor

ALTER TABLE public.articles 
DROP CONSTRAINT IF EXISTS articles_status_check;

ALTER TABLE public.articles 
ADD CONSTRAINT articles_status_check 
CHECK (status::text = ANY (ARRAY['draft'::text, 'pending_review'::text, 'published'::text, 'archived'::text, 'scheduled'::text]));
