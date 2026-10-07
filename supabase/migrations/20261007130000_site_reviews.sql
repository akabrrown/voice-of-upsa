CREATE TABLE public.site_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    is_featured boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.site_reviews ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Anyone can view approved reviews
CREATE POLICY "Approved reviews are viewable by everyone" ON public.site_reviews
    FOR SELECT
    TO public
    USING (status = 'approved');

-- 2. Authenticated users can insert their own reviews
CREATE POLICY "Authenticated users can create reviews" ON public.site_reviews
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 3. Authenticated users can view their own pending/rejected reviews
CREATE POLICY "Users can view their own reviews" ON public.site_reviews
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 4. Admins and editors can manage all reviews
CREATE POLICY "Staff can manage all reviews" ON public.site_reviews
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'editor')
        )
    );

-- Create a trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at 
  BEFORE UPDATE ON public.site_reviews
  FOR EACH ROW 
  EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
