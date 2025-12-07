-- Quick test to check if ad_submissions table exists and has the right structure
-- Run this in Supabase SQL editor

-- Check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE  table_schema = 'public'
   AND    table_name   = 'ad_submissions'
) as table_exists;

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'ad_submissions'
ORDER BY ordinal_position;

-- Test simple insert (remove this after testing)
-- INSERT INTO ad_submissions (first_name, last_name, email, phone, business_type, ad_type, ad_title, ad_description, target_audience, budget, duration, start_date, terms_accepted, status, created_at, updated_at)
-- VALUES ('Test', 'User', 'test@example.com', '1234567890', 'individual', 'banner', 'Test Ad', 'Test Description', 'Test Audience', '100', '1-week', '2024-12-07', true, 'pending', NOW(), NOW());
