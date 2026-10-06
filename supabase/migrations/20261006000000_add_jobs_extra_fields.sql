-- Add missing fields to jobs.postings
ALTER TABLE jobs.postings
ADD COLUMN IF NOT EXISTS organization_website TEXT,
ADD COLUMN IF NOT EXISTS experience_level TEXT;
