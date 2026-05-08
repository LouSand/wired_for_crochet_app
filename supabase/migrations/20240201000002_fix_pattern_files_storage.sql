-- Migration: Fix pattern-files storage policies
-- The bucket and policies were created in 20240101000003_create_storage_buckets.sql.
-- This migration ensures the policies exist correctly using DROP IF EXISTS + CREATE pattern.
-- The root cause of upload failures is that the UI never actually uploads files to storage
-- before creating the pattern record. The policies themselves are correct.

-- Re-create policies to ensure they are correct (idempotent via DROP IF EXISTS)
DROP POLICY IF EXISTS "Users can upload own pattern files" ON storage.objects;
CREATE POLICY "Users can upload own pattern files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'pattern-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can view own pattern files" ON storage.objects;
CREATE POLICY "Users can view own pattern files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'pattern-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update own pattern files" ON storage.objects;
CREATE POLICY "Users can update own pattern files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'pattern-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own pattern files" ON storage.objects;
CREATE POLICY "Users can delete own pattern files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'pattern-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
