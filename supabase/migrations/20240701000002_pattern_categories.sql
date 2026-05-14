-- Add category column to patterns for folder/category organisation
ALTER TABLE patterns ADD COLUMN IF NOT EXISTS category varchar(100) DEFAULT NULL;

-- Index for filtering by category
CREATE INDEX IF NOT EXISTS idx_patterns_category ON patterns(user_id, category);
