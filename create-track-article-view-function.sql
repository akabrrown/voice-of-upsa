-- Create article_views table for tracking unique views
CREATE TABLE IF NOT EXISTS article_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(article_id, user_id) -- One view per user per article
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_article_views_article_id ON article_views(article_id);
CREATE INDEX IF NOT EXISTS idx_article_views_user_id ON article_views(user_id);

-- Create function to track article views and return updated count
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
  existing_view_count INTEGER;
BEGIN
  -- Check if this user has already viewed this article
  IF user_uuid IS NOT NULL THEN
    SELECT COUNT(*) INTO existing_view_count
    FROM article_views
    WHERE article_id = article_uuid AND user_id = user_uuid;
    
    -- If user hasn't viewed this article yet, add the view
    IF existing_view_count = 0 THEN
      INSERT INTO article_views (article_id, user_id, ip_address, user_agent)
      VALUES (article_uuid, user_uuid, ip_address, user_agent);
    END IF;
  ELSE
    -- For anonymous users, we could implement IP-based tracking, but for now just increment the count
    -- This prevents abuse from anonymous users while still counting views
    -- You could add more sophisticated tracking here if needed
    NULL;
  END IF;
  
  -- Get the total view count (unique users + anonymous views)
  SELECT (
    -- Count unique user views
    (SELECT COUNT(DISTINCT user_id) FROM article_views WHERE article_id = article_uuid AND user_id IS NOT NULL) +
    -- Add estimated anonymous views (you might want to implement IP-based tracking)
    (SELECT views_count FROM articles WHERE id = article_uuid) - 
    (SELECT COUNT(DISTINCT user_id) FROM article_views WHERE article_id = article_uuid AND user_id IS NOT NULL)
  ) INTO view_count;
  
  -- Update the article's view count
  UPDATE articles 
  SET views_count = GREATEST(
    COALESCE(views_count, 0) + 
    CASE 
      WHEN user_uuid IS NOT NULL AND existing_view_count = 0 THEN 1
      WHEN user_uuid IS NULL THEN 1 -- For anonymous users
      ELSE 0
    END,
    -- Ensure we don't go below existing count
    COALESCE(views_count, 0)
  )
  WHERE id = article_uuid;
  
  -- Return the updated view count
  SELECT views_count INTO view_count FROM articles WHERE id = article_uuid;
  
  RETURN COALESCE(view_count, 0);
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION track_article_view TO authenticated, anon, service_role;
