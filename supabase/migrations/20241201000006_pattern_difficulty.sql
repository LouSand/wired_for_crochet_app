-- Add difficulty column to patterns (auto-detected by pattern analysis)
ALTER TABLE patterns ADD COLUMN IF NOT EXISTS difficulty varchar(20) DEFAULT NULL;
