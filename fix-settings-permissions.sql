-- Fix RLS permissions for settings table
-- Run this in your Supabase SQL editor

-- Disable RLS for settings table (allows service role key access)
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- If the table doesn't exist, this will show an error
-- In that case, run the full create-settings-table.sql script first
