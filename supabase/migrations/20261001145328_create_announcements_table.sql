-- Create the holiday_wishes table for global announcements and holiday pop-ups
CREATE TABLE IF NOT EXISTS public.holiday_wishes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    holiday_key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    date_type TEXT NOT NULL,
    month INTEGER,
    day INTEGER,
    custom_date_override TEXT,
    headline TEXT NOT NULL,
    body_message TEXT NOT NULL,
    theme_accent TEXT NOT NULL,
    academic_status TEXT NOT NULL,
    featured_article_slug TEXT,
    send_push_notification BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.holiday_wishes ENABLE ROW LEVEL SECURITY;

-- Allow public read access (anyone can see active holiday wishes)
CREATE POLICY "Public can view holiday wishes" 
ON public.holiday_wishes 
FOR SELECT 
USING (true);

-- Allow admins to insert holiday wishes
CREATE POLICY "Admins can insert holiday wishes" 
ON public.holiday_wishes 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Allow admins to update holiday wishes
CREATE POLICY "Admins can update holiday wishes" 
ON public.holiday_wishes 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Allow admins to delete holiday wishes
CREATE POLICY "Admins can delete holiday wishes" 
ON public.holiday_wishes 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Trigger for updated_at
CREATE TRIGGER update_holiday_wishes_updated_at
    BEFORE UPDATE ON public.holiday_wishes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
