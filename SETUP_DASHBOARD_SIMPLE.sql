-- =====================================================
-- SIMPLE DASHBOARD TABLES SETUP - NO COMPLEX LOGIC
-- =====================================================

-- Step 1: Create articles table (ignore if exists)
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT,
    excerpt TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    author_id UUID REFERENCES users(id),
    featured_image_url TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS and grant permissions
ALTER TABLE articles DISABLE ROW LEVEL SECURITY;
GRANT ALL ON articles TO postgres;
GRANT ALL ON articles TO authenticated;
GRANT ALL ON articles TO service_role;
GRANT ALL ON articles TO PUBLIC;

-- Step 2: Create categories table (ignore if exists)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS and grant permissions
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
GRANT ALL ON categories TO postgres;
GRANT ALL ON categories TO authenticated;
GRANT ALL ON categories TO service_role;
GRANT ALL ON categories TO PUBLIC;

-- Step 3: Create comments table (ignore if exists)
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    author_name VARCHAR(255),
    author_email VARCHAR(255),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS and grant permissions
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
GRANT ALL ON comments TO postgres;
GRANT ALL ON comments TO authenticated;
GRANT ALL ON comments TO service_role;
GRANT ALL ON comments TO PUBLIC;

-- Step 4: Insert default categories (ignore conflicts)
INSERT INTO categories (name, slug, description) VALUES
    ('News', 'news', 'Latest news and updates'),
    ('Announcements', 'announcements', 'Official announcements'),
    ('Academics', 'academics', 'Academic programs and updates'),
    ('Sports', 'sports', 'Sports news and achievements')
ON CONFLICT (name) DO NOTHING;

-- Step 5: Tables created - no sample data included
-- Note: Add data through the application interface

-- Step 7: Verification queries
SELECT 'ARTICLES TABLE VERIFICATION' as test_name,
       COUNT(*) as total_articles,
       COUNT(*) FILTER (WHERE status = 'published') as published_articles,
       COUNT(*) FILTER (WHERE status = 'draft') as draft_articles,
       COALESCE(SUM(views_count), 0) as total_views
FROM articles;

SELECT 'USERS TABLE VERIFICATION' as test_name,
       COUNT(*) as total_users,
       COUNT(*) FILTER (WHERE role = 'admin') as admin_users,
       COUNT(*) FILTER (WHERE role = 'editor') as editor_users,
       COUNT(*) FILTER (WHERE role = 'user') as regular_users
FROM users;

SELECT 'COMMENTS TABLE VERIFICATION' as test_name,
       COUNT(*) as total_comments,
       COUNT(*) FILTER (WHERE status = 'approved') as approved_comments,
       COUNT(*) FILTER (WHERE status = 'pending') as pending_comments
FROM comments;

SELECT 'CATEGORIES TABLE VERIFICATION' as test_name,
       COUNT(*) as total_categories
FROM categories;

-- Step 8: Final confirmation
SELECT 'DASHBOARD TABLES SETUP COMPLETED' as status,
       'All tables created/verified with sample data' as description,
       NOW() as completion_time;
