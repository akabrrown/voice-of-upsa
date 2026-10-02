-- Fix for missing updated_at on advertisements

DO $$ 
BEGIN
    -- Ensure advertisements has updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'advertisements' AND column_name = 'updated_at') THEN
        ALTER TABLE public.advertisements ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;
