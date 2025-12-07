-- Insert default categories
INSERT INTO categories (name, slug, description) VALUES
    ('News', 'news', 'Latest news and updates from UPSA'),
    ('Announcements', 'announcements', 'Official announcements and notices'),
    ('Academics', 'academics', 'Academic programs, courses and updates'),
    ('Sports', 'sports', 'Sports news and achievements')
ON CONFLICT (name) DO NOTHING;
