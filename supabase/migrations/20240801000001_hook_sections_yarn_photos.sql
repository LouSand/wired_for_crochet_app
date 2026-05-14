-- Phase 5: Add section tracking to hook_usages for recording which part of pattern used which hook
ALTER TABLE hook_usages ADD COLUMN IF NOT EXISTS section varchar(255) DEFAULT NULL;
ALTER TABLE hook_usages ADD COLUMN IF NOT EXISTS started_at timestamptz DEFAULT NULL;
ALTER TABLE hook_usages ADD COLUMN IF NOT EXISTS ended_at timestamptz DEFAULT NULL;

-- Phase 6: Yarn photos storage bucket already exists (yarn-photos bucket in storage)
-- The photo_path column already exists on yarn_entries
-- No schema changes needed for yarn photos

-- Phase 7: Add manual_progress to projects for manual progress tracking
ALTER TABLE projects ADD COLUMN IF NOT EXISTS manual_progress integer DEFAULT NULL;
