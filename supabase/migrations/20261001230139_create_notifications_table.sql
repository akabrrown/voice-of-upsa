-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    muted BOOLEAN NOT NULL DEFAULT false,
    UNIQUE(profile_id, category)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    channel TEXT NOT NULL DEFAULT 'in_app',
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Preferences: Owner only (read and write)
CREATE POLICY "Users can manage their own notification preferences"
    ON public.notification_preferences
    FOR ALL
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- Notifications: Owner only read, update read_at
CREATE POLICY "Users can read their own notifications"
    ON public.notifications
    FOR SELECT
    USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
    ON public.notifications
    FOR UPDATE
    USING (recipient_id = auth.uid())
    WITH CHECK (recipient_id = auth.uid());

-- Create the notify() function
CREATE OR REPLACE FUNCTION public.notify(
    p_recipient_id UUID, 
    p_type TEXT, 
    p_category TEXT, 
    p_payload JSONB
) RETURNS VOID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_muted BOOLEAN;
BEGIN
    -- 1. Check if the user has muted this category
    SELECT muted INTO v_is_muted 
    FROM public.notification_preferences 
    WHERE profile_id = p_recipient_id AND category = p_category;

    -- If muted, skip inserting
    IF v_is_muted = true THEN
        RETURN;
    END IF;

    -- 2. INSERT into notifications
    INSERT INTO public.notifications (recipient_id, type, category, payload)
    VALUES (p_recipient_id, p_type, p_category, p_payload);
    
    -- Realtime broadcast happens automatically since the table is enabled for it
END;
$$ LANGUAGE plpgsql;

-- Grant execute to authenticated users (or service role)
GRANT EXECUTE ON FUNCTION public.notify TO authenticated;

-- Migration from mart.notifications if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'mart' 
        AND table_name = 'notifications'
    ) THEN
        INSERT INTO public.notifications (recipient_id, type, category, payload, read_at, created_at)
        SELECT 
            profile_id,
            'mart.' || type,
            'campus_mart',
            payload, 
            read_at, 
            created_at
        FROM mart.notifications;
        
        DROP TABLE mart.notifications;
    END IF;
END $$;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
