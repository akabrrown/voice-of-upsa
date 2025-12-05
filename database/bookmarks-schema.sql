-- Bookmarks Table Schema
-- This file contains the SQL schema for the article bookmarks functionality

-- Create the article_bookmarks table
CREATE TABLE IF NOT EXISTS article_bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    UNIQUE(user_id, article_id) -- Prevent duplicate bookmarks
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_article_bookmarks_user_id ON article_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_article_bookmarks_article_id ON article_bookmarks(article_id);
CREATE INDEX IF NOT EXISTS idx_article_bookmarks_created_at ON article_bookmarks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_bookmarks_user_article ON article_bookmarks(user_id, article_id);

-- Create a view for bookmarked articles with details
CREATE OR REPLACE VIEW bookmarked_articles_with_details AS
SELECT 
    ab.id as bookmark_id,
    ab.user_id,
    ab.article_id,
    ab.created_at as bookmarked_at,
    a.id,
    a.title,
    a.slug,
    a.excerpt,
    a.featured_image,
    a.content,
    a.published_at,
    a.views_count,
    a.likes_count,
    a.comments_count,
    a.status,
    a.is_featured,
    a.category_id,
    COALESCE(u.raw_user_meta_data->>'name', u.email) as author_name,
    u.email as author_email,
    COALESCE(u.raw_user_meta_data->>'avatar_url', NULL) as author_avatar,
    c.name as category_name,
    c.slug as category_slug,
    c.color as category_color
FROM article_bookmarks ab
JOIN articles a ON ab.article_id = a.id
JOIN auth.users u ON a.author_id = u.id
LEFT JOIN categories c ON a.category_id = c.id
WHERE a.status = 'published'
ORDER BY ab.created_at DESC;

-- Function to add a bookmark
CREATE OR REPLACE FUNCTION add_bookmark(
    p_user_id UUID,
    p_article_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO article_bookmarks (user_id, article_id)
    VALUES (p_user_id, p_article_id)
    ON CONFLICT (user_id, article_id) DO NOTHING;
    
    -- Update article bookmarks count
    UPDATE articles 
    SET bookmarks_count = (
        SELECT COUNT(*) 
        FROM article_bookmarks 
        WHERE article_id = p_article_id
    )
    WHERE id = p_article_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'Invalid user_id or article_id';
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to remove a bookmark
CREATE OR REPLACE FUNCTION remove_bookmark(
    p_user_id UUID,
    p_article_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM article_bookmarks 
    WHERE user_id = p_user_id AND article_id = p_article_id;
    
    -- Update article bookmarks count
    UPDATE articles 
    SET bookmarks_count = (
        SELECT COUNT(*) 
        FROM article_bookmarks 
        WHERE article_id = p_article_id
    )
    WHERE id = p_article_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'Invalid user_id or article_id';
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to check if an article is bookmarked by a user
CREATE OR REPLACE FUNCTION is_bookmarked(
    p_user_id UUID,
    p_article_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM article_bookmarks 
        WHERE user_id = p_user_id AND article_id = p_article_id
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get user's bookmarks with pagination
CREATE OR REPLACE FUNCTION get_user_bookmarks(
    p_user_id UUID,
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 10,
    p_sort TEXT DEFAULT 'created_at',
    p_order TEXT DEFAULT 'DESC'
) RETURNS TABLE (
    bookmark_id UUID,
    article_id UUID,
    title TEXT,
    slug TEXT,
    excerpt TEXT,
    featured_image TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    author_name TEXT,
    author_avatar TEXT,
    category_name TEXT,
    category_slug TEXT,
    category_color TEXT,
    views_count BIGINT,
    likes_count BIGINT,
    comments_count BIGINT,
    bookmarks_count BIGINT,
    bookmarked_at TIMESTAMP WITH TIME ZONE,
    total_count BIGINT
) AS $$
DECLARE
    v_offset INTEGER;
    v_total_count BIGINT;
BEGIN
    v_offset := (p_page - 1) * p_limit;
    
    -- Get total count
    SELECT COUNT(*) INTO v_total_count
    FROM article_bookmarks ab
    JOIN articles a ON ab.article_id = a.id
    WHERE ab.user_id = p_user_id AND a.status = 'published';
    
    -- Return paginated results
    IF p_order = 'DESC' THEN
        RETURN QUERY
        SELECT 
            ab.id as bookmark_id,
            a.id as article_id,
            a.title,
            a.slug,
            a.excerpt,
            a.featured_image,
            a.published_at,
            COALESCE(u.raw_user_meta_data->>'name', u.email) as author_name,
            COALESCE(u.raw_user_meta_data->>'avatar_url', NULL) as author_avatar,
            c.name as category_name,
            c.slug as category_slug,
            c.color as category_color,
            a.views_count,
            a.likes_count,
            a.comments_count,
            a.bookmarks_count,
            ab.created_at as bookmarked_at,
            v_total_count as total_count
        FROM article_bookmarks ab
        JOIN articles a ON ab.article_id = a.id
        JOIN auth.users u ON a.author_id = u.id
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE ab.user_id = p_user_id AND a.status = 'published'
        ORDER BY 
            CASE 
                WHEN p_sort = 'created_at' THEN ab.created_at
                WHEN p_sort = 'published_at' THEN a.published_at
                WHEN p_sort = 'title' THEN a.title
                ELSE ab.created_at
            END DESC
        LIMIT p_limit OFFSET v_offset;
    ELSE
        RETURN QUERY
        SELECT 
            ab.id as bookmark_id,
            a.id as article_id,
            a.title,
            a.slug,
            a.excerpt,
            a.featured_image,
            a.published_at,
            COALESCE(u.raw_user_meta_data->>'name', u.email) as author_name,
            COALESCE(u.raw_user_meta_data->>'avatar_url', NULL) as author_avatar,
            c.name as category_name,
            c.slug as category_slug,
            c.color as category_color,
            a.views_count,
            a.likes_count,
            a.comments_count,
            a.bookmarks_count,
            ab.created_at as bookmarked_at,
            v_total_count as total_count
        FROM article_bookmarks ab
        JOIN articles a ON ab.article_id = a.id
        JOIN auth.users u ON a.author_id = u.id
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE ab.user_id = p_user_id AND a.status = 'published'
        ORDER BY 
            CASE 
                WHEN p_sort = 'created_at' THEN ab.created_at
                WHEN p_sort = 'published_at' THEN a.published_at
                WHEN p_sort = 'title' THEN a.title
                ELSE ab.created_at
            END ASC
        LIMIT p_limit OFFSET v_offset;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_bookmark_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookmark_updated_at_trigger
    BEFORE UPDATE ON article_bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION update_bookmark_updated_at();

-- Row Level Security (RLS) policies
ALTER TABLE article_bookmarks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own bookmarks
CREATE POLICY "Users can view own bookmarks" ON article_bookmarks
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own bookmarks
CREATE POLICY "Users can create own bookmarks" ON article_bookmarks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own bookmarks
CREATE POLICY "Users can delete own bookmarks" ON article_bookmarks
    FOR DELETE USING (auth.uid() = user_id);

-- Policy: Users can update their own bookmarks (mainly for updated_at)
CREATE POLICY "Users can update own bookmarks" ON article_bookmarks
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON article_bookmarks TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Sample data for testing (optional)
-- INSERT INTO article_bookmarks (user_id, article_id) VALUES
-- ('user-uuid-here', 'article-uuid-here-1'),
-- ('user-uuid-here', 'article-uuid-here-2');
