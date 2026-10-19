-- Migration: 20261014000000_guest_comments_support.sql
-- Description: Add guest author identity and unique device discriminator support to the comments table

-- Allow public and anonymous guest comments
ALTER TABLE public.comments ALTER COLUMN user_id DROP NOT NULL;

-- Enable guest profile and discriminator columns (if not already present)
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS guest_id TEXT;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS guest_badge TEXT;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false NOT NULL;

-- Create indexes for performance and rapid author lookups
CREATE INDEX IF NOT EXISTS idx_comments_guest_id ON public.comments(guest_id);
CREATE INDEX IF NOT EXISTS idx_comments_article_approved ON public.comments(article_id, is_approved, created_at);

-- Update comments table comments for documentation
COMMENT ON COLUMN public.comments.guest_id IS 'Unique device token / fingerprint UUID for non-registered commenters';
COMMENT ON COLUMN public.comments.guest_badge IS 'Unique 4-digit deterministic discriminator tag (e.g. #4821) to distinguish identical display names';
COMMENT ON COLUMN public.comments.author_name IS 'Cached author display name for guest or public commenters';

-- Row Level Security (RLS) Policy Updates for Guest Commenting
DROP POLICY IF EXISTS "Users can insert own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can insert own comments or guests can insert" ON public.comments;

CREATE POLICY "Users can insert own comments or guests can insert"
    ON public.comments FOR INSERT
    WITH CHECK (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id)
        OR
        (auth.uid() IS NULL AND user_id IS NULL AND is_guest = true)
    );

-- Ensure public can view approved comments
DROP POLICY IF EXISTS "Public can view comments" ON public.comments;
CREATE POLICY "Public can view comments"
    ON public.comments FOR SELECT
    USING (is_approved = true AND is_deleted = false);

