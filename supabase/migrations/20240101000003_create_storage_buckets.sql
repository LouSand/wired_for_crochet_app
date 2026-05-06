-- Migration: Create storage buckets with access policies
-- Buckets: progress-photos, pattern-files, yarn-photos
-- All buckets are private with signed URL access.

-- ============================================================
-- Create storage buckets
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'progress-photos',
    'progress-photos',
    false,
    10485760, -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'pattern-files',
    'pattern-files',
    false,
    20971520, -- 20 MB
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
  ),
  (
    'yarn-photos',
    'yarn-photos',
    false,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  );

-- ============================================================
-- Storage policies: progress-photos
-- ============================================================
CREATE POLICY "Users can upload own progress photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own progress photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own progress photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own progress photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- Storage policies: pattern-files
-- ============================================================
CREATE POLICY "Users can upload own pattern files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'pattern-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own pattern files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'pattern-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own pattern files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'pattern-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own pattern files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'pattern-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- Storage policies: yarn-photos
-- ============================================================
CREATE POLICY "Users can upload own yarn photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'yarn-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own yarn photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'yarn-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own yarn photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'yarn-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own yarn photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'yarn-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
