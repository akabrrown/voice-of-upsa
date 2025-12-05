-- Simple article view tracking function
CREATE OR REPLACE FUNCTION track_article_view(
  article_uuid UUID,
  user_uuid UUID DEFAULT NULL,
  ip_address INET DEFAULT NULL,
  user_agent TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  view_count INTEGER;
  existing_view RECORD;
BEGIN
  -- Create article_views table if it doesn't exist
  BEGIN
    CREATE TABLE IF NOT EXISTS article_views (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      ip_address INET,
      user_agent TEXT,
      viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(article_id, user_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_article_views_article_id ON article_views(article_id);
    CREATE INDEX IF NOT EXISTS idx_article_views_user_id ON article_views(user_id);
  EXCEPTION
    WHEN duplicate_table THEN NULL;
  END;
  
  -- Check if this user has already viewed this article
  IF user_uuid IS NOT NULL THEN
    SELECT * INTO existing_view
    FROM article_views
    WHERE article_id = article_uuid AND user_id = user_uuid;
    
    -- If user hasn't viewed this article yet, add the view
    IF existing_view IS NULL THEN
      INSERT INTO article_views (article_id, user_id, ip_address, user_agent)
      VALUES (article_uuid, user_uuid, ip_address, user_agent);
    END IF;
  END IF;
  
  -- Increment the article's view count
  UPDATE articles 
  SET views_count = COALESCE(views_count, 0) + 
    CASE 
      WHEN user_uuid IS NOT NULL AND existing_view IS NULL THEN 1
      WHEN user_uuid IS NULL THEN 1 -- Always count anonymous views
      ELSE 0
    END
  WHERE id = article_uuid;
  
  -- Return the updated view count
  SELECT views_count INTO view_count FROM articles WHERE id = article_uuid;
  
  RETURN COALESCE(view_count, 0);
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION track_article_view TO authenticated, anon, service_role;
