-- Grant permissions to the service_role (used by supabaseAdmin)
GRANT ALL ON public.notification_preferences TO service_role;
GRANT ALL ON public.notification_preferences TO postgres;

-- Grant permissions to authenticated users (RLS policies will still apply)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;

-- Ensure sequence permissions if any (though UUIDs are used here, good practice)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
