-- Fix permissions for article_bookmarks table
-- Run this in your Supabase SQL Editor

-- Grant permissions to the service_role (used by the API)
GRANT ALL ON public.article_bookmarks TO service_role;
GRANT ALL ON public.article_bookmarks TO postgres;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.article_bookmarks TO authenticated;

-- Ensure sequence permissions if any
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verify the table exists and permissions are applied
SELECT * FROM information_schema.role_table_grants WHERE table_name = 'article_bookmarks';
