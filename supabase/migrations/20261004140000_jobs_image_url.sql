ALTER TABLE jobs.postings ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE jobs.postings DROP CONSTRAINT IF EXISTS postings_image_url_https;
ALTER TABLE jobs.postings ADD CONSTRAINT postings_image_url_https
    CHECK (image_url IS NULL OR image_url ~ '^https://res\.cloudinary\.com/');
