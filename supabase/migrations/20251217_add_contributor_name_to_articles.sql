-- Add contributor_name column to articles table
ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS contributor_name TEXT DEFAULT '';

-- Add comment for documentation
COMMENT ON COLUMN public.articles.contributor_name IS 'Name of the contributor to display instead of the author, if provided';
