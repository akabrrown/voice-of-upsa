-- Grant permissions for site_settings
GRANT ALL ON public.site_settings TO service_role;
GRANT ALL ON public.site_settings TO postgres;
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT ON public.site_settings TO authenticated;

-- Grant permissions for articles
GRANT ALL ON public.articles TO service_role;
GRANT ALL ON public.articles TO postgres;
GRANT SELECT ON public.articles TO anon;
GRANT SELECT ON public.articles TO authenticated;

-- Grant permissions for comments
GRANT ALL ON public.comments TO service_role;
GRANT ALL ON public.comments TO postgres;
GRANT SELECT ON public.comments TO anon;
GRANT SELECT, INSERT ON public.comments TO authenticated;

-- Grant permissions for reactions
GRANT ALL ON public.reactions TO service_role;
GRANT ALL ON public.reactions TO postgres;
GRANT SELECT ON public.reactions TO anon;
GRANT SELECT, INSERT, DELETE ON public.reactions TO authenticated;

-- Grant permissions for bookmarks
GRANT ALL ON public.bookmarks TO service_role;
GRANT ALL ON public.bookmarks TO postgres;
GRANT SELECT, INSERT, DELETE ON public.bookmarks TO authenticated;

-- Grant permissions for users (public profiles)
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.users TO postgres;
GRANT SELECT ON public.users TO anon;
GRANT SELECT ON public.users TO authenticated;

-- Grant permissions for notification_preferences (re-applying to be safe)
GRANT ALL ON public.notification_preferences TO service_role;
GRANT ALL ON public.notification_preferences TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant execute on functions (needed for RPCs like toggle_bookmark)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
