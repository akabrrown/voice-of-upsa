-- Add contact_phone to advertisements
ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS contact_phone TEXT;
