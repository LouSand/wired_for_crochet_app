-- Link gauge swatches to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS gauge_swatch_id uuid REFERENCES gauge_swatches(id) ON DELETE SET NULL;
