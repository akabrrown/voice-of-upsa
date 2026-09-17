-- Remove department and year_group columns from profiles

ALTER TABLE public.profiles DROP COLUMN IF EXISTS department;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS year_group;
