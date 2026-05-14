-- Add label photo field to yarn_entries (yarn photo already exists as photo_path)
ALTER TABLE yarn_entries ADD COLUMN IF NOT EXISTS label_photo_path text DEFAULT NULL;
