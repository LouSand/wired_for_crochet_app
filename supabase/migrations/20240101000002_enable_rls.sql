-- Migration: Enable Row-Level Security on all tables
-- Each table gets RLS enabled with policies scoped to auth.uid()
-- for SELECT, INSERT, UPDATE, and DELETE operations.

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE yarn_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE yarn_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE hook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE hook_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_extras ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies: user_settings
-- ============================================================
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own settings"
  ON user_settings FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- RLS Policies: patterns
-- ============================================================
CREATE POLICY "Users can view own patterns"
  ON patterns FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own patterns"
  ON patterns FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own patterns"
  ON patterns FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own patterns"
  ON patterns FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- RLS Policies: projects
-- ============================================================
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- RLS Policies: time_sessions
-- ============================================================
CREATE POLICY "Users can view own time sessions"
  ON time_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own time sessions"
  ON time_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own time sessions"
  ON time_sessions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own time sessions"
  ON time_sessions FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- RLS Policies: counters
-- ============================================================
CREATE POLICY "Users can view own counters"
  ON counters FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own counters"
  ON counters FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own counters"
  ON counters FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own counters"
  ON counters FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- RLS Policies: yarn_entries
-- ============================================================
CREATE POLICY "Users can view own yarn entries"
  ON yarn_entries FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own yarn entries"
  ON yarn_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own yarn entries"
  ON yarn_entries FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own yarn entries"
  ON yarn_entries FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- RLS Policies: yarn_usages
-- ============================================================
CREATE POLICY "Users can view own yarn usages"
  ON yarn_usages FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own yarn usages"
  ON yarn_usages FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own yarn usages"
  ON yarn_usages FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own yarn usages"
  ON yarn_usages FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- RLS Policies: hook_entries
-- ============================================================
CREATE POLICY "Users can view own hook entries"
  ON hook_entries FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own hook entries"
  ON hook_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own hook entries"
  ON hook_entries FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own hook entries"
  ON hook_entries FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- RLS Policies: hook_usages
-- ============================================================
CREATE POLICY "Users can view own hook usages"
  ON hook_usages FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own hook usages"
  ON hook_usages FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own hook usages"
  ON hook_usages FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own hook usages"
  ON hook_usages FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- RLS Policies: pattern_versions
-- ============================================================
CREATE POLICY "Users can view own pattern versions"
  ON pattern_versions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own pattern versions"
  ON pattern_versions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pattern versions"
  ON pattern_versions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own pattern versions"
  ON pattern_versions FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- RLS Policies: progress_photos
-- ============================================================
CREATE POLICY "Users can view own progress photos"
  ON progress_photos FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own progress photos"
  ON progress_photos FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own progress photos"
  ON progress_photos FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own progress photos"
  ON progress_photos FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- RLS Policies: notes
-- ============================================================
CREATE POLICY "Users can view own notes"
  ON notes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own notes"
  ON notes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own notes"
  ON notes FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- RLS Policies: pricing_extras
-- ============================================================
CREATE POLICY "Users can view own pricing extras"
  ON pricing_extras FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own pricing extras"
  ON pricing_extras FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pricing extras"
  ON pricing_extras FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own pricing extras"
  ON pricing_extras FOR DELETE
  USING (user_id = auth.uid());
