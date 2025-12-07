-- Add site_logo column to settings table
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS site_logo text;
