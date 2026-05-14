-- Track how long patterns take to complete (per user/project)
-- Automatically populated when a project is marked as completed

CREATE TABLE IF NOT EXISTS pattern_completion_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id uuid NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_seconds integer NOT NULL,
  difficulty varchar(20),
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

ALTER TABLE pattern_completion_times ENABLE ROW LEVEL SECURITY;

-- Users can see their own completion times
CREATE POLICY "Users manage own completion times" ON pattern_completion_times
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Anyone can view completion times for published patterns (for averages)
CREATE POLICY "Anyone can view completion times for published patterns" ON pattern_completion_times
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM patterns WHERE patterns.id = pattern_completion_times.pattern_id AND patterns.is_published = true)
  );

-- Add average_completion_seconds to patterns for quick lookups
ALTER TABLE patterns ADD COLUMN IF NOT EXISTS average_completion_seconds integer DEFAULT NULL;
ALTER TABLE patterns ADD COLUMN IF NOT EXISTS completion_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_pattern_completion_times_pattern ON pattern_completion_times(pattern_id);
