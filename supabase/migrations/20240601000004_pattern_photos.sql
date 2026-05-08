-- Migration: Add photos support to patterns
-- Allows uploading multiple images per pattern (finished item photos, step photos, etc.)

CREATE TABLE IF NOT EXISTS pattern_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  mime_type TEXT NOT NULL,
  caption TEXT,
  is_cover BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE pattern_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pattern photos"
  ON pattern_photos FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own pattern photos"
  ON pattern_photos FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pattern photos"
  ON pattern_photos FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own pattern photos"
  ON pattern_photos FOR DELETE
  USING (user_id = auth.uid());

-- Index
CREATE INDEX idx_pattern_photos_pattern
  ON pattern_photos (pattern_id, sort_order);
