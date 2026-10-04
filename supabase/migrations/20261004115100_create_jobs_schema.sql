-- Job and Internship Board Schema Migration

-- Create the jobs schema
CREATE SCHEMA IF NOT EXISTS jobs;

-- 1. Create Enums
CREATE TYPE jobs.job_type AS ENUM ('full_time', 'part_time', 'internship', 'volunteer', 'freelance');
CREATE TYPE jobs.location_type AS ENUM ('on_campus', 'accra', 'remote', 'other');
CREATE TYPE jobs.compensation_type AS ENUM ('paid', 'unpaid', 'stipend', 'undisclosed');
CREATE TYPE jobs.apply_method AS ENUM ('link', 'email', 'instructions');
CREATE TYPE jobs.job_status AS ENUM ('pending_review', 'approved', 'rejected', 'closed');
CREATE TYPE jobs.report_reason AS ENUM ('scam', 'fraud', 'misleading', 'inappropriate', 'other');
CREATE TYPE jobs.report_status AS ENUM ('open', 'resolved', 'dismissed');

-- 2. Create job_categories table
CREATE TABLE IF NOT EXISTS jobs.job_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create postings table
CREATE TABLE IF NOT EXISTS jobs.postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    poster_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES jobs.job_categories(id),
    title TEXT NOT NULL,
    organization_name TEXT NOT NULL,
    type jobs.job_type NOT NULL,
    location_type jobs.location_type NOT NULL,
    location_label TEXT,
    description TEXT NOT NULL,
    requirements TEXT NOT NULL,
    compensation_type jobs.compensation_type NOT NULL,
    compensation_details TEXT,
    apply_method jobs.apply_method NOT NULL,
    apply_value TEXT NOT NULL,
    status jobs.job_status NOT NULL DEFAULT 'pending_review',
    expires_at TIMESTAMPTZ,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    search_vector TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(organization_name, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'C')
    ) STORED,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create job_reports table
CREATE TABLE IF NOT EXISTS jobs.job_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    posting_id UUID NOT NULL REFERENCES jobs.postings(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason jobs.report_reason NOT NULL,
    details TEXT,
    status jobs.report_status NOT NULL DEFAULT 'open',
    resolution_note TEXT,
    resolved_by UUID REFERENCES public.profiles(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create indexes
CREATE INDEX idx_postings_category ON jobs.postings(category_id);
CREATE INDEX idx_postings_poster ON jobs.postings(poster_id);
CREATE INDEX idx_postings_status ON jobs.postings(status);
CREATE INDEX idx_postings_search ON jobs.postings USING GIN (search_vector);
CREATE INDEX idx_postings_expires ON jobs.postings(expires_at);

-- 6. RLS Setup

-- Enable RLS
ALTER TABLE jobs.job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs.postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs.job_reports ENABLE ROW LEVEL SECURITY;

-- Categories RLS
CREATE POLICY "Categories are viewable by everyone" ON jobs.job_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON jobs.job_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Postings RLS
CREATE POLICY "Public can view approved active postings" ON jobs.postings
    FOR SELECT USING (
        status = 'approved' 
        AND deleted_at IS NULL 
        AND (expires_at IS NULL OR expires_at > now())
    );

CREATE POLICY "Users can view their own postings" ON jobs.postings
    FOR SELECT USING (poster_id = auth.uid());

CREATE POLICY "Admins can view all postings" ON jobs.postings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can create postings" ON jobs.postings
    FOR INSERT WITH CHECK (auth.uid() = poster_id);

CREATE POLICY "Users can update their own postings" ON jobs.postings
    FOR UPDATE USING (poster_id = auth.uid());

CREATE POLICY "Admins can update all postings" ON jobs.postings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Reports RLS
CREATE POLICY "Users can view their own reports" ON jobs.job_reports
    FOR SELECT USING (reporter_id = auth.uid());

CREATE POLICY "Admins can view all reports" ON jobs.job_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can create reports" ON jobs.job_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can update reports" ON jobs.job_reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 7. Triggers for updated_at
CREATE OR REPLACE FUNCTION jobs.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_job_categories_updated_at
    BEFORE UPDATE ON jobs.job_categories
    FOR EACH ROW EXECUTE FUNCTION jobs.set_updated_at();

CREATE TRIGGER set_postings_updated_at
    BEFORE UPDATE ON jobs.postings
    FOR EACH ROW EXECUTE FUNCTION jobs.set_updated_at();

CREATE TRIGGER set_job_reports_updated_at
    BEFORE UPDATE ON jobs.job_reports
    FOR EACH ROW EXECUTE FUNCTION jobs.set_updated_at();

-- 8. Status Transition Trigger (Enforce rules from Backend-Schema.md)
CREATE OR REPLACE FUNCTION jobs.enforce_posting_status_transition()
RETURNS TRIGGER AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    ) INTO is_admin;

    -- If a non-admin updates an approved posting's content, reset to pending_review
    IF OLD.status = 'approved' AND NOT is_admin THEN
        IF NEW.title != OLD.title OR NEW.description != OLD.description OR NEW.requirements != OLD.requirements OR NEW.compensation_details != OLD.compensation_details OR NEW.apply_value != OLD.apply_value THEN
            NEW.status = 'pending_review';
        END IF;
    END IF;

    -- Prevent regular users from setting status to approved or rejected directly
    IF NEW.status IN ('approved', 'rejected') AND NOT is_admin THEN
        RAISE EXCEPTION 'Only admins can approve or reject postings.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_posting_status_transition_trigger
    BEFORE UPDATE ON jobs.postings
    FOR EACH ROW EXECUTE FUNCTION jobs.enforce_posting_status_transition();

-- 9. Insert default categories
INSERT INTO jobs.job_categories (name, slug, sort_order) VALUES
    ('IT & Tech', 'it-tech', 10),
    ('Business & Finance', 'business-finance', 20),
    ('Marketing & Sales', 'marketing-sales', 30),
    ('Education', 'education', 40),
    ('Healthcare', 'healthcare', 50),
    ('Creative & Design', 'creative-design', 60),
    ('Logistics', 'logistics', 70),
    ('Other', 'other', 80)
ON CONFLICT (slug) DO NOTHING;
