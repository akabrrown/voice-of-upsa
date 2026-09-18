-- Migration: 20260918010000_create_holiday_wishes.sql
-- Description: Create holiday_wishes table for statutory Ghana holiday wishes engine and CMS

CREATE TABLE IF NOT EXISTS public.holiday_wishes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_key VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL,
    date_type VARCHAR(20) NOT NULL, -- 'fixed', 'relative', 'easter', 'islamic'
    month INT,
    day INT,
    custom_date_override DATE,
    headline VARCHAR(255) NOT NULL,
    body_message TEXT NOT NULL,
    theme_accent VARCHAR(30) DEFAULT 'gold', -- 'gold', 'ghana_flag', 'crescent', 'festive', 'laurel'
    academic_status VARCHAR(150) DEFAULT 'University offices and lectures suspended',
    featured_article_slug VARCHAR(255),
    send_push_notification BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.holiday_wishes ENABLE ROW LEVEL SECURITY;

-- 1. Public read access to active holiday wishes
DROP POLICY IF EXISTS "Public can view active holiday wishes" ON public.holiday_wishes;
CREATE POLICY "Public can view active holiday wishes" 
ON public.holiday_wishes 
FOR SELECT 
USING (is_active = true);

-- 2. Authenticated Admins and Editors can view all holiday wishes
DROP POLICY IF EXISTS "Staff can view all holiday wishes" ON public.holiday_wishes;
CREATE POLICY "Staff can view all holiday wishes" 
ON public.holiday_wishes 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
);

-- 3. Admins can update holiday wishes
DROP POLICY IF EXISTS "Admins can update holiday wishes" ON public.holiday_wishes;
CREATE POLICY "Admins can update holiday wishes" 
ON public.holiday_wishes 
FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 4. Admins can insert holiday wishes
DROP POLICY IF EXISTS "Admins can insert holiday wishes" ON public.holiday_wishes;
CREATE POLICY "Admins can insert holiday wishes" 
ON public.holiday_wishes 
FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 5. Admins can delete holiday wishes
DROP POLICY IF EXISTS "Admins can delete holiday wishes" ON public.holiday_wishes;
CREATE POLICY "Admins can delete holiday wishes" 
ON public.holiday_wishes 
FOR DELETE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Seed Data: All 14 Statutory Ghana Public Holidays
INSERT INTO public.holiday_wishes (
    holiday_key, title, date_type, month, day, headline, body_message, theme_accent, academic_status
) VALUES
(
    'new_years_day', 
    'New Year’s Day', 
    'fixed', 
    1, 
    1, 
    'Happy New Year from Voice of UPSA!', 
    'May this new academic and professional year bring immense growth, groundbreaking achievements, and academic excellence to the entire UPSA community.', 
    'festive', 
    'University offices, faculties, and lecture halls closed.'
),
(
    'constitution_day', 
    'Constitution Day', 
    'fixed', 
    1, 
    7, 
    'Commemorating Constitution Day', 
    'Celebrating the enduring strength of the 1992 Fourth Republican Constitution of Ghana, upholding good governance, academic freedom, and democratic rule of law.', 
    'ghana_flag', 
    'Statutory public holiday — Lectures and administrative duties suspended.'
),
(
    'independence_day', 
    'Independence Day', 
    'fixed', 
    3, 
    6, 
    'Happy Independence Day, Ghana! 🇬🇭', 
    'Voice of UPSA salutes our national sovereignty, heritage, and collective resolve to build an exceptional African nation led by ethical professionals and leaders.', 
    'ghana_flag', 
    'National holiday — Campus academic activities suspended.'
),
(
    'good_friday', 
    'Good Friday', 
    'easter', 
    NULL, 
    NULL, 
    'Reflective and Blessed Good Friday', 
    'Wishing all Christian students, faculty, alumni, and friends of UPSA a peaceful and spiritually renewing Good Friday.', 
    'gold', 
    'Statutory public holiday — All campus operations suspended.'
),
(
    'easter_monday', 
    'Easter Monday', 
    'easter', 
    NULL, 
    NULL, 
    'Joyous Easter Monday Wishes', 
    'Celebrating life, renewal, and hope with the entire UPSA family. Have a joyful, restful, and safe holiday celebration.', 
    'gold', 
    'Statutory public holiday — Lectures resume on Tuesday.'
),
(
    'workers_day', 
    'Workers’ Day (Labour Day)', 
    'fixed', 
    5, 
    1, 
    'Honouring All Workers & Lecturers on May Day', 
    'We honor the dedication, scholarship, and tireless contributions of our lecturers, administrative personnel, and service staff who keep UPSA thriving.', 
    'gold', 
    'Labour Day holiday — Campus offices and classes closed.'
),
(
    'eid_ul_fitr', 
    'Eid-ul-Fitr', 
    'islamic', 
    NULL, 
    NULL, 
    'Eid Mubarak to the UPSA Muslim Community! 🌙', 
    'May the blessings, sacrifice, and prayers of Ramadan enrich your spiritual walk and bring lasting peace, unity, and abundance to your families.', 
    'crescent', 
    'Public holiday — Subject to official moon sighting announcement.'
),
(
    'shaqq_day', 
    'Shaqq Day', 
    'islamic', 
    NULL, 
    NULL, 
    'Blessed Shaqq Day Celebrations', 
    'Extending continuous warm greetings to all Muslims as we observe Shaqq Day following the joyous Eid-ul-Fitr feast.', 
    'crescent', 
    'Public holiday observed in Ghana.'
),
(
    'eid_ul_adha', 
    'Eid-ul-Adha', 
    'islamic', 
    NULL, 
    NULL, 
    'Eid-ul-Adha Mubarak! 🌙', 
    'May the inspiring lessons of unwavering faith, obedience, and selflessness inspire our academic journey and personal lives.', 
    'crescent', 
    'Public holiday — Gazetted by the Ministry of the Interior.'
),
(
    'republic_day', 
    'Republic Day', 
    'fixed', 
    7, 
    1, 
    'Celebrating Ghana’s Republic Day 🇬🇭', 
    'Remembering our republic’s journey and reaffirming our pledge as professional scholars to contribute constructively to national development.', 
    'ghana_flag', 
    'Senior Citizens & Republic Day commemoration.'
),
(
    'founders_day', 
    'Founder’s Day', 
    'fixed', 
    9, 
    21, 
    'Commemorating Founder’s Day', 
    'Honoring Osagyefo Dr. Kwame Nkrumah and the founding fathers whose visionary sacrifice ignited the flame of freedom across the African continent.', 
    'ghana_flag', 
    'Statutory public holiday.'
),
(
    'farmers_day', 
    'National Farmers’ Day', 
    'relative', 
    12, 
    NULL, 
    'Saluting Ghana’s Farmers & Fishers', 
    'Voice of UPSA celebrates the hardworking farmers and agribusiness champions who sustain our economy, universities, and communities.', 
    'laurel', 
    'Statutory public holiday — Observed on the first Friday of December.'
),
(
    'christmas_day', 
    'Christmas Day', 
    'fixed', 
    12, 
    25, 
    'Merry Christmas from Voice of UPSA! 🎄', 
    'Wishing our student body, leadership, staff, and cherished readers a joyful and blessed Christmas filled with harmony, love, and goodwill.', 
    'festive', 
    'Christmas break — University in recess.'
),
(
    'boxing_day', 
    'Boxing Day', 
    'fixed', 
    12, 
    26, 
    'Warm Boxing Day Wishes', 
    'May the spirit of benevolence and generosity gladden your homes as we celebrate Boxing Day and reflect on the year’s blessings.', 
    'festive', 
    'Statutory public holiday.'
)
ON CONFLICT (holiday_key) DO NOTHING;
