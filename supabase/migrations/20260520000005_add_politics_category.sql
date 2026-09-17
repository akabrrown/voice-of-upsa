-- Insert "Politics" category into public.categories table
INSERT INTO public.categories (name, slug, description, banner_url)
VALUES (
    'Politics', 
    'politics', 
    'Student governance, SRC political campaigns, leadership elections, and student body advocacy.',
    'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?q=80&w=2000'
)
ON CONFLICT (slug) DO NOTHING;
