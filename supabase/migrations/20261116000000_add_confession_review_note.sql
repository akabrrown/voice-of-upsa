-- Migration: Ensure review_note column exists on confession_posts table
-- Resolves: 42703 column confession_posts.review_note does not exist

ALTER TABLE public.confession_posts ADD COLUMN IF NOT EXISTS review_note text;

