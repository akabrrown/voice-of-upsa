-- Enforce posting rules in the database so they hold no matter how a write
-- arrives: through the app's server actions or straight through the Supabase
-- API with a user's own session. Replaces enforce_posting_status_transition,
-- which only ran on UPDATE, compared with != (so NULL -> value slipped
-- through) and watched just five content columns.
--
-- Non-admin owners:
--   INSERT  status forced to pending_review, cannot self-feature, 5 per 24h,
--           closing date (if given) must be in the future and within 90 days.
--   UPDATE  can never touch id, slug, poster_id, is_featured, deleted_at,
--           created_at. Can close a posting. Can move the closing date
--           (future, within 90 days, cannot clear it) without re-review.
--           Any content change sends the posting back to pending_review.
--           Closed or removed postings are frozen.
-- Admins and trusted roles (service_role, postgres) are not restricted.

DROP TRIGGER IF EXISTS enforce_posting_status_transition_trigger ON jobs.postings;
DROP FUNCTION IF EXISTS jobs.enforce_posting_status_transition();

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

    -- Approved or rejected content that changes goes back to the review queue.
    IF content_changed THEN
        NEW.status := 'pending_review';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_posting_write_trigger ON jobs.postings;
CREATE TRIGGER guard_posting_write_trigger
    BEFORE INSERT OR UPDATE ON jobs.postings
    FOR EACH ROW EXECUTE FUNCTION jobs.guard_posting_write();
