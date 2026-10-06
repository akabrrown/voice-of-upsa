-- Verifies jobs.guard_posting_write (migration 20261006100000).
--
-- Run in the Supabase SQL editor AFTER applying the migration. It acts as a
-- real non-admin user and attacks jobs.postings directly, the same way a
-- caller with the anon key and their own session could.
--
-- Nothing persists: the script always ends by raising an error, which rolls
-- the whole transaction back.
--   Success -> error text starts with "ALL POSTING GUARD TESTS PASSED"
--   Failure -> error text starts with "FAIL"

BEGIN;

-- Setup as the privileged editor role: pick a non-admin user and a category.
DO $$
DECLARE
    test_uid UUID;
    test_category UUID;
BEGIN
    SELECT p.id INTO test_uid
    FROM public.profiles p
    WHERE p.role IS DISTINCT FROM 'admin'
    ORDER BY (
        SELECT count(*) FROM jobs.postings jp
        WHERE jp.poster_id = p.id AND jp.created_at > now() - INTERVAL '24 hours'
    )
    LIMIT 1;

    SELECT id INTO test_category FROM jobs.job_categories WHERE is_active LIMIT 1;

    IF test_uid IS NULL OR test_category IS NULL THEN
        RAISE EXCEPTION 'FAIL setup: need at least one non-admin profile and one active job category';
    END IF;

    PERFORM set_config('posting_test.uid', test_uid::text, true);
    PERFORM set_config('posting_test.category', test_category::text, true);
    PERFORM set_config('request.jwt.claims',
        json_build_object('sub', test_uid, 'role', 'authenticated')::text, true);
END $$;

-- Phase 1: inserts, as the user.
SET LOCAL ROLE authenticated;

DO $$
DECLARE
    uid UUID := current_setting('posting_test.uid')::uuid;
    cat UUID := current_setting('posting_test.category')::uuid;
    new_id UUID;
    got_status TEXT;
    got_featured BOOLEAN;
BEGIN
    -- Smuggling approved + featured on insert must be neutralised.
    INSERT INTO jobs.postings (slug, poster_id, category_id, title, organization_name, type,
        location_type, description, requirements, compensation_type, compensation_details,
        apply_method, apply_value, status, is_featured, image_url)
    VALUES ('guard-test-' || gen_random_uuid(), uid, cat, 'Guard test posting', 'Guard Test Org',
        'internship', 'remote', repeat('Guard test description. ', 3), 'Guard test requirements',
        'unpaid', NULL, 'link', 'https://example.org/apply', 'approved', true, NULL)
    RETURNING id, status::text, is_featured INTO new_id, got_status, got_featured;

    IF got_status <> 'pending_review' OR got_featured THEN
        RAISE EXCEPTION 'FAIL insert: self-approve/feature not blocked (status=%, featured=%)', got_status, got_featured;
    END IF;
    PERFORM set_config('posting_test.pid', new_id::text, true);

    -- Closing date beyond the 90-day window.
    BEGIN
        INSERT INTO jobs.postings (slug, poster_id, category_id, title, organization_name, type,
            location_type, description, requirements, compensation_type, apply_method, apply_value, expires_at)
        VALUES ('guard-test-' || gen_random_uuid(), uid, cat, 'Guard far expiry', 'Guard Test Org',
            'internship', 'remote', repeat('Guard test description. ', 3), 'Guard test requirements',
            'unpaid', 'link', 'https://example.org/apply', now() + INTERVAL '200 days');
        RAISE EXCEPTION 'FAIL insert: 200-day closing date accepted';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE 'FAIL%' THEN RAISE; END IF;
    END;

    -- Posting as someone else.
    BEGIN
        INSERT INTO jobs.postings (slug, poster_id, category_id, title, organization_name, type,
            location_type, description, requirements, compensation_type, apply_method, apply_value)
        VALUES ('guard-test-' || gen_random_uuid(), gen_random_uuid(), cat, 'Guard impersonation', 'Guard Test Org',
            'internship', 'remote', repeat('Guard test description. ', 3), 'Guard test requirements',
            'unpaid', 'link', 'https://example.org/apply');
        RAISE EXCEPTION 'FAIL insert: posting as another user accepted';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE 'FAIL%' THEN RAISE; END IF;
    END;
END $$;

-- Admin approves the posting (privileged role, trigger lets it through).
RESET ROLE;
UPDATE jobs.postings SET status = 'approved'
WHERE id = current_setting('posting_test.pid')::uuid;

-- Phase 2: owner edits on an approved posting.
SET LOCAL ROLE authenticated;

DO $$
DECLARE
    pid UUID := current_setting('posting_test.pid')::uuid;
    got_status TEXT;
BEGIN
    -- Moving the closing date is instant: stays approved.
    UPDATE jobs.postings SET expires_at = now() + INTERVAL '30 days'
    WHERE id = pid RETURNING status::text INTO got_status;
    IF got_status <> 'approved' THEN
        RAISE EXCEPTION 'FAIL update: closing-date change left the board (status=%)', got_status;
    END IF;

    -- Clearing the closing date (to live forever) is refused.
    BEGIN
        UPDATE jobs.postings SET expires_at = NULL WHERE id = pid;
        RAISE EXCEPTION 'FAIL update: closing date cleared';
    EXCEPTION WHEN OTHERS THEN IF SQLERRM LIKE 'FAIL%' THEN RAISE; END IF; END;

    -- Extending past the window is refused.
    BEGIN
        UPDATE jobs.postings SET expires_at = now() + INTERVAL '200 days' WHERE id = pid;
        RAISE EXCEPTION 'FAIL update: 200-day closing date accepted';
    EXCEPTION WHEN OTHERS THEN IF SQLERRM LIKE 'FAIL%' THEN RAISE; END IF; END;

    -- Owner cannot set review status.
    BEGIN
        UPDATE jobs.postings SET status = 'rejected' WHERE id = pid;
        RAISE EXCEPTION 'FAIL update: owner changed review status';
    EXCEPTION WHEN OTHERS THEN IF SQLERRM LIKE 'FAIL%' THEN RAISE; END IF; END;

    -- Protected columns.
    BEGIN
        UPDATE jobs.postings SET is_featured = true WHERE id = pid;
        RAISE EXCEPTION 'FAIL update: owner featured own posting';
    EXCEPTION WHEN OTHERS THEN IF SQLERRM LIKE 'FAIL%' THEN RAISE; END IF; END;

    BEGIN
        UPDATE jobs.postings SET slug = 'guard-test-hijack-' || gen_random_uuid() WHERE id = pid;
        RAISE EXCEPTION 'FAIL update: owner changed slug';
    EXCEPTION WHEN OTHERS THEN IF SQLERRM LIKE 'FAIL%' THEN RAISE; END IF; END;

    BEGIN
        UPDATE jobs.postings SET deleted_at = now() WHERE id = pid;
        RAISE EXCEPTION 'FAIL update: owner changed deleted_at';
    EXCEPTION WHEN OTHERS THEN IF SQLERRM LIKE 'FAIL%' THEN RAISE; END IF; END;

    BEGIN
        UPDATE jobs.postings SET poster_id = gen_random_uuid() WHERE id = pid;
        RAISE EXCEPTION 'FAIL update: owner transferred posting';
    EXCEPTION WHEN OTHERS THEN IF SQLERRM LIKE 'FAIL%' THEN RAISE; END IF; END;

    -- The old NULL hole on a previously unwatched column: image_url NULL -> value.
    UPDATE jobs.postings SET image_url = 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
    WHERE id = pid RETURNING status::text INTO got_status;
    IF got_status <> 'pending_review' THEN
        RAISE EXCEPTION 'FAIL update: NULL->value image change stayed live (status=%)', got_status;
    END IF;
END $$;

-- Re-approve to test the remaining content path and closing.
RESET ROLE;
UPDATE jobs.postings SET status = 'approved'
WHERE id = current_setting('posting_test.pid')::uuid;
SET LOCAL ROLE authenticated;

DO $$
DECLARE
    pid UUID := current_setting('posting_test.pid')::uuid;
    got_status TEXT;
BEGIN
    -- NULL compensation_details -> value (the original != bug).
    UPDATE jobs.postings SET compensation_details = 'GHS 2,000 / month'
    WHERE id = pid RETURNING status::text INTO got_status;
    IF got_status <> 'pending_review' THEN
        RAISE EXCEPTION 'FAIL update: NULL->value compensation change stayed live (status=%)', got_status;
    END IF;

    -- Closing and editing in one write is refused.
    BEGIN
        UPDATE jobs.postings SET status = 'closed', apply_value = 'https://evil.example/phish' WHERE id = pid;
        RAISE EXCEPTION 'FAIL update: close + content change accepted';
    EXCEPTION WHEN OTHERS THEN IF SQLERRM LIKE 'FAIL%' THEN RAISE; END IF; END;

    -- Plain close works.
    UPDATE jobs.postings SET status = 'closed' WHERE id = pid RETURNING status::text INTO got_status;
    IF got_status <> 'closed' THEN
        RAISE EXCEPTION 'FAIL update: owner could not close (status=%)', got_status;
    END IF;

    -- Closed postings are frozen.
    BEGIN
        UPDATE jobs.postings SET title = 'Reopened guard test' WHERE id = pid;
        RAISE EXCEPTION 'FAIL update: closed posting edited';
    EXCEPTION WHEN OTHERS THEN IF SQLERRM LIKE 'FAIL%' THEN RAISE; END IF; END;

    BEGIN
        UPDATE jobs.postings SET status = 'pending_review' WHERE id = pid;
        RAISE EXCEPTION 'FAIL update: closed posting reopened';
    EXCEPTION WHEN OTHERS THEN IF SQLERRM LIKE 'FAIL%' THEN RAISE; END IF; END;
END $$;

-- Phase 3: daily insert limit (5 per 24h) holds for direct API inserts.
DO $$
DECLARE
    uid UUID := current_setting('posting_test.uid')::uuid;
    cat UUID := current_setting('posting_test.category')::uuid;
    attempts INT := 0;
    blocked BOOLEAN := false;
BEGIN
    WHILE attempts < 6 AND NOT blocked LOOP
        BEGIN
            INSERT INTO jobs.postings (slug, poster_id, category_id, title, organization_name, type,
                location_type, description, requirements, compensation_type, apply_method, apply_value)
            VALUES ('guard-test-' || gen_random_uuid(), uid, cat, 'Guard limit test', 'Guard Test Org',
                'internship', 'remote', repeat('Guard test description. ', 3), 'Guard test requirements',
                'unpaid', 'link', 'https://example.org/apply');
            attempts := attempts + 1;
        EXCEPTION WHEN OTHERS THEN
            IF SQLERRM LIKE 'Daily posting limit%' THEN blocked := true; ELSE RAISE; END IF;
        END;
    END LOOP;

    IF NOT blocked THEN
        RAISE EXCEPTION 'FAIL insert: daily limit not enforced after % direct inserts', attempts;
    END IF;
END $$;

DO $$
BEGIN
    RAISE EXCEPTION 'ALL POSTING GUARD TESTS PASSED (transaction rolled back, nothing saved)';
END $$;
