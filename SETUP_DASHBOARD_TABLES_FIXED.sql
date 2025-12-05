-- =====================================================
-- SETUP ALL TABLES NEEDED FOR DASHBOARD (FIXED VERSION)
-- =====================================================

-- Step 1: Create articles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'articles') THEN
        CREATE TABLE articles (
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
        
        -- Disable RLS for admin operations
        ALTER TABLE articles DISABLE ROW LEVEL SECURITY;
        
        -- Grant permissions
        GRANT ALL ON articles TO postgres;
        GRANT ALL ON articles TO authenticated;
        GRANT ALL ON articles TO service_role;
        GRANT ALL ON articles TO PUBLIC;
        
        RAISE NOTICE 'Created articles table';
    ELSE
        -- Ensure RLS is disabled
        ALTER TABLE articles DISABLE ROW LEVEL SECURITY;
        
        -- Check for missing columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'views_count') THEN
            ALTER TABLE articles ADD COLUMN views_count INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'likes_count') THEN
            ALTER TABLE articles ADD COLUMN likes_count INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'comments_count') THEN
            ALTER TABLE articles ADD COLUMN comments_count INTEGER DEFAULT 0;
        END IF;
        
        RAISE NOTICE 'Articles table verified and updated';
    END IF;
END $$;

-- Step 2: Create categories table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
        CREATE TABLE categories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) UNIQUE NOT NULL,
            slug VARCHAR(100) UNIQUE NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Disable RLS
        ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
        
        -- Grant permissions
        GRANT ALL ON categories TO postgres;
        GRANT ALL ON categories TO authenticated;
        GRANT ALL ON categories TO service_role;
        GRANT ALL ON categories TO PUBLIC;
        
        RAISE NOTICE 'Created categories table';
    ELSE
        -- Ensure RLS is disabled
        ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Categories table verified';
    END IF;
END $$;

-- Step 3: Insert default categories
INSERT INTO categories (name, slug, description) VALUES
    ('News', 'news', 'Latest news and updates'),
    ('Announcements', 'announcements', 'Official announcements'),
    ('Academics', 'academics', 'Academic programs and updates'),
    ('Sports', 'sports', 'Sports news and achievements'),
    ('Student Life', 'student-life', 'Student activities and campus life')
ON CONFLICT (name) DO NOTHING;

-- Step 4: Create comments table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') THEN
        CREATE TABLE comments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            content TEXT NOT NULL,
            author_name VARCHAR(255),
            author_email VARCHAR(255),
            article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
            status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Disable RLS
        ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
        
        -- Grant permissions
        GRANT ALL ON comments TO postgres;
        GRANT ALL ON comments TO authenticated;
        GRANT ALL ON comments TO service_role;
        GRANT ALL ON comments TO PUBLIC;
        
        RAISE NOTICE 'Created comments table';
    ELSE
        -- Ensure RLS is disabled
        ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Comments table verified';
    END IF;
END $$;

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
