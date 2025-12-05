-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification type toggles
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  article_comments BOOLEAN DEFAULT true,
  new_followers BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT false,
  security_alerts BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create unique constraint - one preference row per user
CREATE UNIQUE INDEX IF NOT EXISTS notification_preferences_user_id_unique 
ON public.notification_preferences(user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS notification_preferences_user_id_idx 
ON public.notification_preferences(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Editors and admins can view their preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Editors and admins can insert their preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Editors and admins can update their preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Editors and admins can delete their preferences" ON public.notification_preferences;

-- RLS Policies - Only editors and admins can access
-- View own preferences (must be editor or admin)
CREATE POLICY "Editors and admins can view their preferences" 
ON public.notification_preferences
FOR SELECT 
USING (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('editor', 'admin')
  )
);

-- Insert own preferences (must be editor or admin)
CREATE POLICY "Editors and admins can insert their preferences" 
ON public.notification_preferences
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('editor', 'admin')
  )
);

-- Update own preferences (must be editor or admin)
CREATE POLICY "Editors and admins can update their preferences" 
ON public.notification_preferences
FOR UPDATE 
USING (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('editor', 'admin')
  )
);

-- Delete own preferences (must be editor or admin)
CREATE POLICY "Editors and admins can delete their preferences" 
ON public.notification_preferences
FOR DELETE 
USING (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('editor', 'admin')
  )
);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
DROP TRIGGER IF EXISTS notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Function to create default preferences for new editors/admins
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create preferences for editors and admins
  IF NEW.role IN ('editor', 'admin') THEN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default preferences when user becomes editor/admin
DROP TRIGGER IF EXISTS create_notification_preferences_on_role_change ON public.users;
CREATE TRIGGER create_notification_preferences_on_role_change
  AFTER INSERT OR UPDATE OF role ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- Verify the table was created
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'notification_preferences'
ORDER BY ordinal_position;
