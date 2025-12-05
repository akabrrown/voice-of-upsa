-- Function to toggle a bookmark (add if not exists, remove if exists)
CREATE OR REPLACE FUNCTION toggle_bookmark(
    article_uuid UUID,
    user_uuid UUID
) RETURNS BOOLEAN AS $$
DECLARE
    is_bookmarked BOOLEAN;
BEGIN
    -- Check if bookmark exists
    SELECT EXISTS (
        SELECT 1 
        FROM article_bookmarks 
        WHERE user_id = user_uuid AND article_id = article_uuid
    ) INTO is_bookmarked;
    
    IF is_bookmarked THEN
        -- Remove bookmark
        DELETE FROM article_bookmarks 
        WHERE user_id = user_uuid AND article_id = article_uuid;
        
        -- Update article bookmarks count (if column exists)
        -- Using safe update to avoid error if column missing
        BEGIN
            UPDATE articles 
            SET bookmarks_count = (
                SELECT COUNT(*) 
                FROM article_bookmarks 
                WHERE article_id = article_uuid
            )
            WHERE id = article_uuid;
        EXCEPTION WHEN OTHERS THEN
            -- Ignore if column doesn't exist
        END;
        
        RETURN FALSE;
    ELSE
        -- Add bookmark
        INSERT INTO article_bookmarks (user_id, article_id)
        VALUES (user_uuid, article_uuid);
        
        -- Update article bookmarks count
        BEGIN
            UPDATE articles 
            SET bookmarks_count = (
                SELECT COUNT(*) 
                FROM article_bookmarks 
                WHERE article_id = article_uuid
            )
            WHERE id = article_uuid;
        EXCEPTION WHEN OTHERS THEN
            -- Ignore
        END;
        
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users and service_role
GRANT EXECUTE ON FUNCTION toggle_bookmark(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_bookmark(UUID, UUID) TO service_role;
