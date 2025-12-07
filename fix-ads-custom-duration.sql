-- Quick fix: Add custom_duration column if it doesn't exist
-- Run this in Supabase SQL editor immediately

DO $$
BEGIN
    -- Check if column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='ad_submissions' 
        AND column_name='custom_duration'
    ) THEN
        ALTER TABLE ad_submissions ADD COLUMN custom_duration TEXT;
        
        -- Add comment
        COMMENT ON COLUMN ad_submissions.custom_duration IS 'Custom duration specified by user when duration is set to "custom"';
        
        RAISE NOTICE 'custom_duration column added successfully';
    ELSE
        RAISE NOTICE 'custom_duration column already exists';
    END IF;
END $$;

-- Test the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ad_submissions' 
AND column_name IN ('duration', 'custom_duration')
ORDER BY column_name;
