-- Migration: Site Pages & Navigation Dynamic Controls
-- Timestamp: 20261104000000
-- Target Project: Voice of UPSA (public.site_pages)

SET search_path = public, auth;

-- 1. Create site_pages table
CREATE TABLE IF NOT EXISTS public.site_pages (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    href TEXT NOT NULL,
    section TEXT NOT NULL, -- 'campus_life', 'community', 'main_nav', 'footer'
    description TEXT,
    icon_name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    show_in_nav BOOLEAN NOT NULL DEFAULT true,
    show_in_footer BOOLEAN NOT NULL DEFAULT true,
    maintenance_message TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_site_pages_section ON public.site_pages(section);
CREATE INDEX IF NOT EXISTS idx_site_pages_is_active ON public.site_pages(is_active);
CREATE INDEX IF NOT EXISTS idx_site_pages_sort_order ON public.site_pages(sort_order);

-- 3. Enable Row Level Security
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "Public can view site pages" ON public.site_pages;
CREATE POLICY "Public can view site pages" ON public.site_pages
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage site pages" ON public.site_pages;
CREATE POLICY "Admins can manage site pages" ON public.site_pages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 5. Seed default site pages
INSERT INTO public.site_pages (id, title, href, section, description, icon_name, is_active, show_in_nav, show_in_footer, maintenance_message, sort_order)
VALUES
    -- Campus Life
    ('services', 'Student Services', '/services', 'campus_life', 'Access official campus services and directories.', 'Briefcase', true, true, true, 'Student Services directory is temporarily updating its contact records. Check back soon!', 1),
    ('handbook', 'Student Handbook', '/handbook', 'campus_life', 'Official rules, regulations, and academic programs.', 'BookOpen', true, true, true, 'The student handbook is being updated with the latest academic curriculum.', 2),
    ('jobs', 'Jobs Board', '/jobs', 'campus_life', 'Find internships, part-time jobs, and career opportunities.', 'Users', true, true, true, 'Our jobs portal is currently awaiting new verified campus postings.', 3),
    ('mart', 'Campus Mart', '/mart', 'campus_life', 'Buy, sell, and trade within the campus community.', 'Store', false, false, false, 'Campus Mart is preparing for its official launch. Stay tuned!', 4),
    ('map', 'Campus Map', '/map', 'campus_life', 'Navigate the university with an interactive map.', 'Map', false, false, false, 'Interactive campus map is currently under technical calibration.', 5),

    -- Community Media
    ('podcasts', 'Podcasts', '/podcasts', 'community', 'Listen to student voices and interviews.', 'Mic', true, true, true, 'New podcast series and episodes are currently in studio production!', 6),
    ('gallery', 'Gallery', '/gallery', 'community', 'Explore campus photos and event memories.', 'Camera', true, true, true, 'The gallery is being curated with the latest campus event highlights.', 7),
    ('confessions', 'Confessions', '/confessions', 'community', 'Share confessions and opinions safely.', 'EyeOff', true, true, true, 'The confessions portal is temporarily under moderation review.', 8),
    ('polls', 'Polls', '/polls', 'community', 'Vote on pressing campus issues and debates.', 'BarChart3', true, true, true, 'New campus debates and voting questions are coming up soon!', 9),
    ('tv', 'Video TV', '/tv', 'community', 'Watch campus news, shows, and event coverage.', 'Video', false, false, false, 'Voice of UPSA TV broadcasts are launching shortly.', 10),
    ('ai-assistant', 'AI Assistant', '/ai-assistant', 'community', 'Your smart virtual campus guide.', 'Bot', false, false, false, 'The AI campus assistant is currently training on the student handbook.', 11),

    -- Main Navigation Links
    ('advertise', 'Advertise', '/advertise', 'main_nav', 'Advertising packages, rate cards, and ad submission.', 'Megaphone', true, true, true, 'Advertising bookings are temporarily closed for system maintenance.', 12),
    ('about', 'About', '/about', 'main_nav', 'About Voice of UPSA, editorial team, and our mission.', 'Info', true, true, true, 'Our about page is currently receiving editorial updates.', 13),
    ('contact', 'Contact', '/contact', 'main_nav', 'Contact the editorial desk, news tips, and support.', 'PhoneCall', true, true, true, 'Contact forms are currently offline. Please email voice.of.upsa.mail@gmail.com directly.', 14)

ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    href = EXCLUDED.href,
    section = EXCLUDED.section,
    description = EXCLUDED.description,
    icon_name = EXCLUDED.icon_name,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

