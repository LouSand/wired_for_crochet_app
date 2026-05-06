-- Migration: Add estimated completion date and priority to projects
-- Enables deadline tracking, priority ordering, and notification logic

-- Add estimated_completion_date column
ALTER TABLE projects ADD COLUMN IF NOT EXISTS estimated_completion_date DATE DEFAULT NULL;

-- Add priority column (1 = highest, 5 = lowest, NULL = unset)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT NULL
  CHECK (priority IS NULL OR (priority >= 1 AND priority <= 5));

-- Create index for sorting by deadline and priority
CREATE INDEX IF NOT EXISTS idx_projects_deadline ON projects (user_id, estimated_completion_date)
  WHERE estimated_completion_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects (user_id, priority)
  WHERE priority IS NOT NULL;
