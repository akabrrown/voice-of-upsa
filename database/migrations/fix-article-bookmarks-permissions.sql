-- Grant permissions to the service_role (used by supabaseAdmin)
GRANT ALL ON public.article_bookmarks TO service_role;
GRANT ALL ON public.article_bookmarks TO postgres;

-- Grant permissions to authenticated users (RLS policies will still apply)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.article_bookmarks TO authenticated;

-- Ensure sequence permissions if any
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
