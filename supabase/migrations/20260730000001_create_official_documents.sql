CREATE TABLE IF NOT EXISTS public.official_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.official_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to official_documents"
  ON public.official_documents
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admins/editors to insert official_documents"
  ON public.official_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

CREATE POLICY "Allow admins/editors to update official_documents"
  ON public.official_documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

CREATE POLICY "Allow admins/editors to delete official_documents"
  ON public.official_documents
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );
