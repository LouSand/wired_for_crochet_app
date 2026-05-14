-- Fix storage buckets and policies for file uploads

-- Create invoices bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create yarn-photos bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'yarn-photos',
  'yarn-photos',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Permissive policies for authenticated users on invoices bucket
DROP POLICY IF EXISTS "Users can upload invoices" ON storage.objects;
CREATE POLICY "Users can upload invoices" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'invoices');

DROP POLICY IF EXISTS "Users can read own invoices" ON storage.objects;
CREATE POLICY "Users can read own invoices" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'invoices');

DROP POLICY IF EXISTS "Users can update invoices" ON storage.objects;
CREATE POLICY "Users can update invoices" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'invoices');

DROP POLICY IF EXISTS "Users can delete own invoices" ON storage.objects;
CREATE POLICY "Users can delete own invoices" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'invoices');

-- Permissive policies for yarn-photos bucket
DROP POLICY IF EXISTS "Users can upload yarn photos" ON storage.objects;
CREATE POLICY "Users can upload yarn photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'yarn-photos');

DROP POLICY IF EXISTS "Users can read yarn photos" ON storage.objects;
CREATE POLICY "Users can read yarn photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'yarn-photos');

DROP POLICY IF EXISTS "Users can delete yarn photos" ON storage.objects;
CREATE POLICY "Users can delete yarn photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'yarn-photos');
