-- Migration: Add structured yarn requirements to patterns
-- Allows specifying multiple yarns with quantities in different units per pattern

CREATE TABLE IF NOT EXISTS pattern_yarn_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  yarn_name TEXT NOT NULL,
  colour TEXT,
  weight_category TEXT,  -- e.g. DK, Aran, Chunky, 4ply
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL CHECK (unit IN ('grams', 'ounces', 'metres', 'yards', 'skeins', 'balls', 'pieces')),
  secondary_quantity NUMERIC,
  secondary_unit TEXT CHECK (secondary_unit IS NULL OR secondary_unit IN ('grams', 'ounces', 'metres', 'yards', 'skeins', 'balls', 'pieces')),
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE pattern_yarn_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pattern yarn requirements"
  ON pattern_yarn_requirements FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own pattern yarn requirements"
  ON pattern_yarn_requirements FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pattern yarn requirements"
  ON pattern_yarn_requirements FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own pattern yarn requirements"
  ON pattern_yarn_requirements FOR DELETE
  USING (user_id = auth.uid());

-- Index
CREATE INDEX idx_pattern_yarn_requirements_pattern
  ON pattern_yarn_requirements (pattern_id, sort_order);
