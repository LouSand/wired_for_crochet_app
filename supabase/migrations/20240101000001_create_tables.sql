-- Migration: Create all tables for Crochet Project Tracker
-- This migration creates the core database schema with all tables,
-- foreign keys, constraints, and indexes.

-- ============================================================
-- 1. user_settings
-- ============================================================
CREATE TABLE user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  default_hourly_rate decimal(10,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. patterns (created before projects due to FK reference)
-- ============================================================
CREATE TABLE patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title varchar(255) NOT NULL,
  type varchar(20) NOT NULL,
  introduction text,
  materials_list text,
  hook_size varchar(50),
  yarn_info text,
  gauge text,
  abbreviations text,
  instructions text,
  notes text,
  file_path text,
  file_name varchar(255),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. projects
-- ============================================================
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name varchar(255) NOT NULL,
  description text,
  status varchar(20) NOT NULL DEFAULT 'planned',
  difficulty varchar(20),
  customer_name varchar(255),
  date_started date,
  date_completed date,
  hourly_rate_override decimal(10,2),
  pattern_id uuid REFERENCES patterns,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. time_sessions
-- ============================================================
CREATE TABLE time_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. counters
-- ============================================================
CREATE TABLE counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  name varchar(100) NOT NULL,
  current_value integer NOT NULL DEFAULT 0 CHECK (current_value >= 0),
  target_value integer CHECK (target_value > 0),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. yarn_entries
-- ============================================================
CREATE TABLE yarn_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name varchar(255) NOT NULL,
  brand varchar(255),
  colour varchar(100),
  shade_code varchar(50),
  dye_lot varchar(50),
  weight_category varchar(20),
  thickness varchar(50),
  fibre_content text,
  washing_instructions text,
  recommended_hook_size varchar(20),
  quantity_owned decimal(10,2) NOT NULL DEFAULT 0,
  cost_per_unit decimal(10,2),
  photo_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. yarn_usages
-- ============================================================
CREATE TABLE yarn_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  yarn_entry_id uuid REFERENCES yarn_entries NOT NULL,
  project_id uuid REFERENCES projects NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  quantity_used decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. hook_entries
-- ============================================================
CREATE TABLE hook_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  size varchar(20) NOT NULL,
  type varchar(50),
  brand varchar(255),
  material varchar(100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. hook_usages
-- ============================================================
CREATE TABLE hook_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hook_entry_id uuid REFERENCES hook_entries NOT NULL,
  project_id uuid REFERENCES projects NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. pattern_versions
-- ============================================================
CREATE TABLE pattern_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id uuid REFERENCES patterns NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  instructions text NOT NULL,
  version_number integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 11. progress_photos
-- ============================================================
CREATE TABLE progress_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  file_path text NOT NULL,
  file_name varchar(255) NOT NULL,
  file_size integer NOT NULL,
  mime_type varchar(50) NOT NULL,
  caption text,
  is_final boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 12. notes
-- ============================================================
CREATE TABLE notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  content text NOT NULL,
  category varchar(30) NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 13. pricing_extras
-- ============================================================
CREATE TABLE pricing_extras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  description varchar(255) NOT NULL,
  amount decimal(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes for common query patterns
-- ============================================================
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_time_sessions_project_id ON time_sessions(project_id);
CREATE INDEX idx_time_sessions_user_id ON time_sessions(user_id);
CREATE INDEX idx_counters_project_id ON counters(project_id);
CREATE INDEX idx_yarn_entries_user_id ON yarn_entries(user_id);
CREATE INDEX idx_yarn_usages_yarn_entry_id ON yarn_usages(yarn_entry_id);
CREATE INDEX idx_yarn_usages_project_id ON yarn_usages(project_id);
CREATE INDEX idx_hook_entries_user_id ON hook_entries(user_id);
CREATE INDEX idx_hook_usages_project_id ON hook_usages(project_id);
CREATE INDEX idx_patterns_user_id ON patterns(user_id);
CREATE INDEX idx_pattern_versions_pattern_id ON pattern_versions(pattern_id);
CREATE INDEX idx_progress_photos_project_id ON progress_photos(project_id);
CREATE INDEX idx_notes_project_id ON notes(project_id);
CREATE INDEX idx_pricing_extras_project_id ON pricing_extras(project_id);
