-- Quick fix: Disable RLS temporarily for admin testing
-- Run this in Supabase SQL editor to allow admin access immediately

ALTER TABLE anonymous_messages DISABLE ROW LEVEL SECURITY;

-- After testing, run the comprehensive fix to re-enable with proper policies
-- ALTER TABLE anonymous_messages ENABLE ROW LEVEL SECURITY;
