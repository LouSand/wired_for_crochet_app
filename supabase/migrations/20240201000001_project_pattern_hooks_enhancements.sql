-- Migration: project-pattern-hooks-enhancements
-- Adds currency to projects, compatibility metadata to hook_entries

-- 1. Add currency column to projects (default USD)
ALTER TABLE projects
  ADD COLUMN currency varchar(3) NOT NULL DEFAULT 'USD';

-- 2. Add JSONB compatibility columns to hook_entries
ALTER TABLE hook_entries
  ADD COLUMN yarn_types jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN pattern_types jsonb DEFAULT '[]'::jsonb;

-- 3. Create GIN indexes for efficient JSONB containment queries
CREATE INDEX idx_hook_entries_yarn_types ON hook_entries USING GIN (yarn_types);
CREATE INDEX idx_hook_entries_pattern_types ON hook_entries USING GIN (pattern_types);
