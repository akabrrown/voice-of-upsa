-- Migration to add indices to the articles table for performance optimization
-- Date: 2025-12-30

-- Index on status for faster filtering of published articles
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);

-- Index on category_id for faster category-based filtering
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON public.articles(category_id);

-- Index on published_at for faster sorting (most common sort order)
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at DESC);

-- Index on author_id for author-based filtering
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON public.articles(author_id);

-- Index on is_featured and featured_order for homepage/featured sorting
CREATE INDEX IF NOT EXISTS idx_articles_featured ON public.articles(is_featured, featured_order);

-- Index on views_count for sorting by popularity
CREATE INDEX IF NOT EXISTS idx_articles_views_count ON public.articles(views_count DESC);

-- Index on slug for faster lookups (usually already indexed if unique, but explicit is fine)
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);

-- Add helpful comment
COMMENT ON INDEX idx_articles_status IS 'Optimizes filtering by article status (published, draft, etc.)';
COMMENT ON INDEX idx_articles_category_id IS 'Optimizes filtering by category';
COMMENT ON INDEX idx_articles_published_at IS 'Optimizes sorting by publication date';
