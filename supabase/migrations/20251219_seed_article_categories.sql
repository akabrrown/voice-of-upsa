-- Insert article categories
-- Note: Using INSERT ... ON CONFLICT DO NOTHING to avoid duplicates on re-run

INSERT INTO categories (name, slug, description, is_active, order_index)
VALUES
  ('News', 'news', 'Latest news and updates from UPSA', true, 1),
  ('Announcements', 'announcements', 'Official announcements and notices', true, 2),
  ('Events', 'events', 'Upcoming and past events at UPSA', true, 3),
  ('Opinions', 'opinions', 'Opinion pieces and editorials', true, 4),
  ('Features', 'features', 'Feature articles and in-depth stories', true, 5),
  ('Sports', 'sports', 'Sports news and updates', true, 6),
  ('Academics', 'academics', 'Academic-related content and resources', true, 7)
ON CONFLICT (slug) DO NOTHING;
