CREATE TYPE jobs.revision_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE jobs.posting_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    posting_id UUID NOT NULL REFERENCES jobs.postings(id) ON DELETE CASCADE,
    poster_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    proposed_changes JSONB NOT NULL,
    status jobs.revision_status NOT NULL DEFAULT 'pending',
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure only one pending revision per posting
CREATE UNIQUE INDEX idx_posting_revisions_one_pending ON jobs.posting_revisions(posting_id) WHERE status = 'pending';
CREATE INDEX idx_posting_revisions_poster_id ON jobs.posting_revisions(poster_id);

ALTER TABLE jobs.posting_revisions ENABLE ROW LEVEL SECURITY;

-- Admins can manage all revisions
CREATE POLICY "Admins have full access to revisions"
    ON jobs.posting_revisions
    FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Users can view their own revisions
CREATE POLICY "Users can view own revisions"
    ON jobs.posting_revisions
    FOR SELECT
    TO authenticated
    USING (poster_id = auth.uid());

-- Triggers to auto-update updated_at
CREATE TRIGGER update_jobs_posting_revisions_modtime
    BEFORE UPDATE ON jobs.posting_revisions
    FOR EACH ROW EXECUTE FUNCTION jobs.set_updated_at();

-- Update jobs.guard_posting_write to intercept content edits on approved posts
CREATE OR REPLACE FUNCTION jobs.guard_posting_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    max_window CONSTANT INTERVAL := INTERVAL '90 days';
    daily_limit CONSTANT INT := 5;
    acting_admin BOOLEAN;
    content_changed BOOLEAN;
    recent_count INT;
    changes_json JSONB;
BEGIN
    -- Service role, migrations and the SQL editor run as privileged roles.
    IF current_user NOT IN ('authenticated', 'anon') THEN
        RETURN NEW;
    END IF;

    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Sign in required.' USING ERRCODE = '42501';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    ) INTO acting_admin;

    IF acting_admin THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF NEW.poster_id IS DISTINCT FROM auth.uid() THEN
            RAISE EXCEPTION 'You can only post as yourself.' USING ERRCODE = '42501';
        END IF;

        -- Serialise concurrent inserts per user so the limit can't be raced.
        PERFORM pg_advisory_xact_lock(hashtextextended('jobs.postings:' || auth.uid()::text, 0));

        SELECT count(*) INTO recent_count
        FROM jobs.postings
        WHERE poster_id = auth.uid()
          AND created_at > now() - INTERVAL '24 hours';

        IF recent_count >= daily_limit THEN
            RAISE EXCEPTION 'Daily posting limit reached. Try again tomorrow.' USING ERRCODE = 'P0001';
        END IF;

        IF NEW.expires_at IS NOT NULL
           AND (NEW.expires_at <= now() OR NEW.expires_at > now() + max_window) THEN
            RAISE EXCEPTION 'Closing date must be in the future and within 90 days.' USING ERRCODE = '22023';
        END IF;

        NEW.status := 'pending_review';
        NEW.is_featured := false;
        NEW.deleted_at := NULL;
        NEW.created_at := now();
        RETURN NEW;
    END IF;

    -- UPDATE. RLS already limits owners to rows where poster_id = auth.uid().
    IF OLD.deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'This posting was removed and can no longer be edited.' USING ERRCODE = '42501';
    END IF;

    IF OLD.status = 'closed' THEN
        RAISE EXCEPTION 'Closed postings cannot be edited or reopened.' USING ERRCODE = '42501';
    END IF;

    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.slug IS DISTINCT FROM OLD.slug
       OR NEW.poster_id IS DISTINCT FROM OLD.poster_id
       OR NEW.is_featured IS DISTINCT FROM OLD.is_featured
       OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'Only admins can change that field.' USING ERRCODE = '42501';
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'closed' THEN
        RAISE EXCEPTION 'Only admins can change a posting''s review status.' USING ERRCODE = '42501';
    END IF;

    -- Optional text columns are stored as '' by the app but may be NULL on
    -- older rows; treat both as "empty" so a no-op save isn't a change.
    content_changed :=
           NEW.category_id IS DISTINCT FROM OLD.category_id
        OR NEW.title IS DISTINCT FROM OLD.title
        OR NEW.organization_name IS DISTINCT FROM OLD.organization_name
        OR NULLIF(NEW.organization_website, '') IS DISTINCT FROM NULLIF(OLD.organization_website, '')
        OR NEW.type IS DISTINCT FROM OLD.type
        OR COALESCE(NULLIF(NEW.experience_level, ''), 'not_applicable')
           IS DISTINCT FROM COALESCE(NULLIF(OLD.experience_level, ''), 'not_applicable')
        OR NEW.location_type IS DISTINCT FROM OLD.location_type
        OR NULLIF(NEW.location_label, '') IS DISTINCT FROM NULLIF(OLD.location_label, '')
        OR NEW.description IS DISTINCT FROM OLD.description
        OR NEW.requirements IS DISTINCT FROM OLD.requirements
        OR NEW.compensation_type IS DISTINCT FROM OLD.compensation_type
        OR NULLIF(NEW.compensation_details, '') IS DISTINCT FROM NULLIF(OLD.compensation_details, '')
        OR NEW.apply_method IS DISTINCT FROM OLD.apply_method
        OR NEW.apply_value IS DISTINCT FROM OLD.apply_value
        OR NULLIF(NEW.image_url, '') IS DISTINCT FROM NULLIF(OLD.image_url, '');

    IF NEW.status = 'closed' AND content_changed THEN
        RAISE EXCEPTION 'Close the posting or edit it, not both at once.' USING ERRCODE = '22023';
    END IF;

    IF NEW.expires_at IS DISTINCT FROM OLD.expires_at THEN
        IF NEW.expires_at IS NULL THEN
            RAISE EXCEPTION 'A closing date can be moved but not removed.' USING ERRCODE = '22023';
        END IF;
        IF NEW.expires_at <= now() OR NEW.expires_at > now() + max_window THEN
            RAISE EXCEPTION 'Closing date must be in the future and within 90 days.' USING ERRCODE = '22023';
        END IF;
    END IF;

    -- Handle content changes based on current status
    IF content_changed THEN
        IF OLD.status = 'approved' THEN
            -- Build the JSON of new changes
            changes_json := jsonb_build_object(
                'category_id', NEW.category_id,
                'title', NEW.title,
                'organization_name', NEW.organization_name,
                'organization_website', NEW.organization_website,
                'type', NEW.type,
                'experience_level', NEW.experience_level,
                'location_type', NEW.location_type,
                'location_label', NEW.location_label,
                'description', NEW.description,
                'requirements', NEW.requirements,
                'compensation_type', NEW.compensation_type,
                'compensation_details', NEW.compensation_details,
                'apply_method', NEW.apply_method,
                'apply_value', NEW.apply_value,
                'image_url', NEW.image_url
            );

            -- Upsert into posting_revisions
            INSERT INTO jobs.posting_revisions (posting_id, poster_id, proposed_changes, status)
            VALUES (OLD.id, OLD.poster_id, changes_json, 'pending')
            ON CONFLICT (posting_id) WHERE status = 'pending'
            DO UPDATE SET 
                proposed_changes = EXCLUDED.proposed_changes,
                updated_at = now();

            -- Revert protected fields on the main post so it stays approved and untouched
            NEW.category_id := OLD.category_id;
            NEW.title := OLD.title;
            NEW.organization_name := OLD.organization_name;
            NEW.organization_website := OLD.organization_website;
            NEW.type := OLD.type;
            NEW.experience_level := OLD.experience_level;
            NEW.location_type := OLD.location_type;
            NEW.location_label := OLD.location_label;
            NEW.description := OLD.description;
            NEW.requirements := OLD.requirements;
            NEW.compensation_type := OLD.compensation_type;
            NEW.compensation_details := OLD.compensation_details;
            NEW.apply_method := OLD.apply_method;
            NEW.apply_value := OLD.apply_value;
            NEW.image_url := OLD.image_url;
            -- Notice: NEW.status remains OLD.status ('approved')
        ELSE
            -- If it's already pending_review or rejected, update in-place and send back to review queue.
            NEW.status := 'pending_review';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;
