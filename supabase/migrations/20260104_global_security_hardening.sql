-- Global Security Hardening Migration
-- Last Updated: 2026-01-04

-- 1. Ensure RLS is enabled on all sensitive tables
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ad_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS anonymous_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contact_messages ENABLE ROW LEVEL SECURITY;

-- 2. Revoke all permissions from anon role except for specific public functions
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- 3. Grant limited access to anon for necessary public functions
GRANT SELECT ON articles TO anon;
GRANT SELECT ON categories TO anon;
GRANT SELECT ON ad_locations TO anon;
GRANT INSERT ON contact_messages TO anon;
GRANT INSERT ON ad_submissions TO anon;
GRANT INSERT ON anonymous_stories TO anon;

-- 4. Harden User RLS Policies
-- Users should only be able to see their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Admins can view all users
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can read all profiles" ON users;
CREATE POLICY "Admins can view all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Harden Settings RLS Policies
-- Only admins can view or modify settings (unless public exposure is needed)
DROP POLICY IF EXISTS "Admins can manage settings" ON settings;
DROP POLICY IF EXISTS "Authenticated users can read settings" ON settings;
CREATE POLICY "Admins can manage settings" ON settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 7. Secure Ad Submissions (Public can only view published/approved)
DROP POLICY IF EXISTS "Public can view published ads" ON ad_submissions;
CREATE POLICY "Public can view published ads" ON ad_submissions
  FOR SELECT USING (status IN ('published', 'approved'));

-- 8. Prevent privilege escalation via role column
-- In the users table, ensure that regular users cannot update their own role
DROP POLICY IF EXISTS "Users can update their own non-sensitive data" ON users;
CREATE POLICY "Users can update their own non-sensitive data" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    (CASE WHEN role IS DISTINCT FROM (SELECT role FROM users WHERE id = auth.uid()) THEN false ELSE true END)
  );

-- 9. Cleanup: Revoke direct table access from auth role if not needed
-- (Most access should be via RLS, but revoking explicitly is safer)
-- GRANT USAGE ON SCHEMA public TO authenticated;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
