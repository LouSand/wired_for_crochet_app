-- Pattern annotations: stores drawing/highlight data per project-pattern combination
-- Annotations are tied to a project so they can be kept or discarded when the project finishes

CREATE TABLE IF NOT EXISTS pattern_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  pattern_id uuid NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_number integer NOT NULL DEFAULT 1,
  annotation_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, pattern_id, page_number)
);

-- RLS
ALTER TABLE pattern_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own annotations"
  ON pattern_annotations
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Index for fast lookups
CREATE INDEX idx_pattern_annotations_project_pattern
  ON pattern_annotations(project_id, pattern_id);
