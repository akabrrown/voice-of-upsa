-- Enable realtime for site_settings table
-- This allows admins to see settings changes in realtime

-- Add site_settings table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;

-- Verify the table is in the publication
SELECT 
  schemaname, 
  tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'site_settings';

-- Note: Make sure RLS policies are already set up for site_settings table
-- Only admins should be able to view and modify settings
