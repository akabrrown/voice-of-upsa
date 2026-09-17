-- Migration: Harden Auth Roles & Profile Security
-- Date: 2026-09-18
-- Fixes: VOU-SEC-01 (Privilege Escalation via user_metadata)

-- 1. Redefine handle_new_user() to STRICTLY ignore raw_user_meta_data->>'role'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
    user_role TEXT;
BEGIN
    -- Only trust server-side service-role metadata (raw_app_meta_data).
    -- NEVER evaluate client-supplied raw_user_meta_data for authorization roles.
    user_role := COALESCE(new.raw_app_meta_data->>'role', 'public');

    -- Restrict to valid roles, defaulting strictly to 'public'
    IF user_role NOT IN ('admin', 'editor', 'public') THEN
        user_role := 'public';
    END IF;

    -- Create profile with default safe role
    INSERT INTO public.profiles (id, full_name, username, avatar_url, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'User ' || substr(new.id::text, 1, 8)),
        COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
        new.raw_user_meta_data->>'avatar_url',
        user_role
    )
    ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role;

    -- Assign role in granular permissions table
    SELECT id INTO default_role_id FROM public.roles WHERE name = user_role;
    IF default_role_id IS NULL THEN
        SELECT id INTO default_role_id FROM public.roles WHERE name = 'public';
    END IF;

    IF default_role_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES (new.id, default_role_id)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Redefine sync_user_role() to ONLY sync server-authoritative raw_app_meta_data
CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    target_role_id UUID;
BEGIN
    -- Only evaluate raw_app_meta_data (set strictly via Supabase admin service-role)
    user_role := new.raw_app_meta_data->>'role';

    -- If a valid admin/editor/public role is provided via raw_app_meta_data, sync it
    IF user_role IS NOT NULL AND user_role IN ('admin', 'editor', 'public') THEN
        UPDATE public.profiles
        SET role = user_role
        WHERE id = new.id;

        SELECT id INTO target_role_id FROM public.roles WHERE name = user_role;
        IF target_role_id IS NOT NULL THEN
            DELETE FROM public.user_roles WHERE user_id = new.id;
            INSERT INTO public.user_roles (user_id, role_id)
            VALUES (new.id, target_role_id)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Prevent users from updating their own 'role' column on public.profiles
CREATE OR REPLACE FUNCTION public.prevent_profile_role_tampering()
RETURNS TRIGGER AS $$
BEGIN
    -- If role is being modified, verify the executing user is an administrator
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ) THEN
            -- Revert the role change to the existing role
            NEW.role := OLD.role;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_profile_role_tampering ON public.profiles;
CREATE TRIGGER trg_prevent_profile_role_tampering
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_profile_role_tampering();
