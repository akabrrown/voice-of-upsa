-- Phase 0: Shared Infrastructure for Notifications and Reports

-- 1. Update shared ENUMs
ALTER TYPE public.report_reason ADD VALUE IF NOT EXISTS 'spam';
-- report_status already has 'open', 'resolved', 'dismissed', and 'investigating'

-- 2. Create public.reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    resource_type text NOT NULL,
    resource_id text NOT NULL,
    reason public.report_reason NOT NULL DEFAULT 'other',
    details text,
    status public.report_status DEFAULT 'open',
    resolution_note text,
    resolved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolved_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Create public.notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    type text NOT NULL,
    category text NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    channel text DEFAULT 'in_app',
    read_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- 4. Create public.notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    category text NOT NULL,
    muted boolean DEFAULT false,
    UNIQUE(profile_id, category)
);

-- 5. Create notify() function
CREATE OR REPLACE FUNCTION public.notify(
    recipient_id uuid,
    type text,
    category text,
    payload jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user muted this category
    IF EXISTS (
        SELECT 1 FROM public.notification_preferences np 
        WHERE np.profile_id = notify.recipient_id 
        AND np.category = notify.category 
        AND np.muted = true
    ) THEN
        RETURN;
    END IF;

    -- Insert notification
    INSERT INTO public.notifications (recipient_id, type, category, payload)
    VALUES (recipient_id, type, category, payload);
END;
$$;

-- 6. Migrate data from mart_reports to reports
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mart_reports') THEN
        INSERT INTO public.reports (id, reporter_id, resource_type, resource_id, reason, details, status, resolution_note, resolved_by, resolved_at, created_at, updated_at)
        SELECT 
            id, 
            reporter_id, 
            'campus_mart_' || entity_type::text AS resource_type,
            entity_id::text AS resource_id,
            -- Map old enum if possible, else default to 'other'
            'other'::public.report_reason AS reason,
            reason AS details, -- Assuming old mart_reports had a reason text column or we put old enum into details
            status::text::public.report_status AS status,
            resolution_note,
            resolved_by,
            resolved_at,
            created_at,
            updated_at
        FROM public.mart_reports;
    END IF;
END $$;

-- 7. Migrate data from mart_notifications to notifications
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mart_notifications') THEN
        INSERT INTO public.notifications (id, recipient_id, type, category, payload, read_at, created_at)
        SELECT 
            id, 
            profile_id AS recipient_id,
            'mart.' || type::text AS type,
            'campus_mart' AS category,
            payload,
            read_at,
            created_at
        FROM public.mart_notifications;
    END IF;
END $$;

-- 8. Enable RLS on the new tables
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies
-- Reports: Reporter reads own; Admin reads all
CREATE POLICY "Users can view their own reports" ON public.reports
    FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports" ON public.reports
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Users can insert reports" ON public.reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can update reports" ON public.reports
    FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Notifications: Owner reads/updates own, inserted via trigger/function
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = recipient_id);

-- Preferences: Owner only
CREATE POLICY "Users can view their own notification preferences" ON public.notification_preferences
    FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own notification preferences" ON public.notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own notification preferences" ON public.notification_preferences
    FOR UPDATE USING (auth.uid() = profile_id);

-- Note: We are keeping the old tables for now to avoid breaking existing Campus Mart server actions. 
-- In a subsequent PR/step, we will update the server actions to use the new tables and drop the old ones.
