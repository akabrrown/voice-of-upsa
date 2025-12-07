-- Add custom_duration field to ad_submissions table
-- Migration: 20241207_add_custom_duration_to_ads.sql

ALTER TABLE ad_submissions 
ADD COLUMN custom_duration TEXT;

-- Add comment for documentation
COMMENT ON COLUMN ad_submissions.custom_duration IS 'Custom duration specified by user when duration is set to "custom"';

-- Create index for better performance on custom_duration queries
CREATE INDEX idx_ad_submissions_custom_duration ON ad_submissions(custom_duration) WHERE custom_duration IS NOT NULL;
