-- Article Table RLS Security Policies
-- This migration enables Row-Level Security on the articles table
-- and creates policies to ensure only admin/editor roles can create, update, or delete articles

-- 1. Enable RLS on articles table
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Only admin/editor can INSERT articles
DROP POLICY IF EXISTS "articles_insert_policy" ON articles;
CREATE POLICY "articles_insert_policy" ON articles
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'editor')
  )
);

-- 3. Policy: Only admin/editor can UPDATE articles
-- Also allows article authors to update their own articles
DROP POLICY IF EXISTS "articles_update_policy" ON articles;
CREATE POLICY "articles_update_policy" ON articles
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'editor')
  )
  OR author_id = auth.uid()
);

-- 4. Policy: Only admin can DELETE articles
DROP POLICY IF EXISTS "articles_delete_policy" ON articles;
CREATE POLICY "articles_delete_policy" ON articles
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- 5. Policy: SELECT - Published articles are public, drafts visible to admin/editor/author
DROP POLICY IF EXISTS "articles_select_policy" ON articles;
CREATE POLICY "articles_select_policy" ON articles
FOR SELECT TO authenticated, anon
USING (
  status = 'published' OR
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'editor')
  )
  OR author_id = auth.uid()
);

-- Add helpful comment
COMMENT ON TABLE articles IS 'Articles table with RLS enabled. Only admins and editors can create/update. Authors can update their own. Only admins can delete.';
