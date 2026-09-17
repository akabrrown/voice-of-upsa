-- 1. Update the new user trigger function to support role passing
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
    user_role TEXT;
BEGIN
    -- Determine role (default to 'public')
    user_role := COALESCE(
        new.raw_app_meta_data->>'role',
        new.raw_user_meta_data->>'role',
        'public'
    );

    -- Ensure role is valid
    IF user_role NOT IN ('admin', 'editor', 'public') THEN
        user_role := 'public';
    END IF;

    -- Create profile
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

    -- Get role ID for granular system
    SELECT id INTO default_role_id FROM public.roles WHERE name = user_role;
    IF default_role_id IS NULL THEN
        SELECT id INTO default_role_id FROM public.roles WHERE name = 'public';
    END IF;

    -- Assign role in granular system
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (new.id, default_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create trigger function to sync roles on auth user updates
CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    target_role_id UUID;
BEGIN
    user_role := COALESCE(
        new.raw_app_meta_data->>'role',
        new.raw_user_meta_data->>'role'
    );

    -- If role is specified and valid, sync it
    IF user_role IS NOT NULL AND user_role IN ('admin', 'editor', 'public') THEN
        -- Update public.profiles
        UPDATE public.profiles
        SET role = user_role
        WHERE id = new.id;

        -- Get granular role ID
        SELECT id INTO target_role_id FROM public.roles WHERE name = user_role;
        
        IF target_role_id IS NOT NULL THEN
            -- Delete existing roles to prevent duplication
            DELETE FROM public.user_roles WHERE user_id = new.id;
            -- Insert the updated role
            INSERT INTO public.user_roles (user_id, role_id)
            VALUES (new.id, target_role_id)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.sync_user_role();

-- 3. One-time synchronization of all existing users who have mismatching roles
UPDATE public.profiles p
SET role = COALESCE(u.raw_app_meta_data->>'role', u.raw_user_meta_data->>'role', 'public')
FROM auth.users u
WHERE p.id = u.id 
  AND p.role <> COALESCE(u.raw_app_meta_data->>'role', u.raw_user_meta_data->>'role', 'public')
  AND COALESCE(u.raw_app_meta_data->>'role', u.raw_user_meta_data->>'role') IN ('admin', 'editor', 'public');
