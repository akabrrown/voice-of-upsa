-- Enable Realtime for articles table
-- This script enables real-time subscriptions for the articles table

-- Enable realtime for the articles table (handle if already enabled)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'articles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE articles;
        RAISE NOTICE 'Realtime enabled for articles table';
    ELSE
        RAISE NOTICE 'Articles table already has realtime enabled';
    END IF;
END $$;

-- Verify that realtime is enabled
SELECT 
  schemaname,
  tablename,
  'realtime' as feature
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
  AND tablename = 'articles';

-- Show all tables with realtime enabled
SELECT 
  schemaname,
  tablename,
  'realtime' as feature
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

SELECT 'Realtime setup completed successfully' as status;
