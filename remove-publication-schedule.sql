-- Remove publication schedule features from database
-- This script removes all scheduling-related columns and data

-- Remove scheduling-related columns from articles table
DO $$
BEGIN
    -- Check if columns exist before dropping them
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'scheduled_at') THEN
        ALTER TABLE articles DROP COLUMN scheduled_at;
        RAISE NOTICE 'Dropped column: scheduled_at';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'timezone') THEN
        ALTER TABLE articles DROP COLUMN timezone;
        RAISE NOTICE 'Dropped column: timezone';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'auto_publish') THEN
        ALTER TABLE articles DROP COLUMN auto_publish;
        RAISE NOTICE 'Dropped column: auto_publish';
    END IF;
    
    -- Also remove the schedule-related API endpoints if they exist as records
    -- (This is optional cleanup for any API endpoint tracking tables)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_endpoints') THEN
        DELETE FROM api_endpoints WHERE path LIKE '%schedule%';
        RAISE NOTICE 'Cleaned up schedule-related API endpoint records';
    END IF;
    
    RAISE NOTICE 'Publication schedule features removed successfully';
END $$;

-- Verify the columns have been removed
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'articles' 
    AND column_name IN ('scheduled_at', 'timezone', 'auto_publish')
ORDER BY column_name;

-- Show remaining publication-related columns (for reference)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'articles' 
    AND column_name LIKE '%publish%' OR column_name LIKE '%feature%'
ORDER BY column_name;
