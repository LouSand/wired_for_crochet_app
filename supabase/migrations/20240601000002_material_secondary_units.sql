-- Migration: Add secondary unit tracking to materials
-- Allows tracking materials in multiple measurement units
-- e.g. a yarn can be tracked as 3 skeins AND 450 metres

-- Update the unit CHECK constraint to include new units
ALTER TABLE materials DROP CONSTRAINT IF EXISTS materials_unit_check;
ALTER TABLE materials ADD CONSTRAINT materials_unit_check
  CHECK (unit IN ('grams', 'ounces', 'metres', 'yards', 'skeins', 'balls', 'pieces'));

-- Add secondary unit fields
ALTER TABLE materials ADD COLUMN IF NOT EXISTS secondary_unit TEXT DEFAULT NULL
  CHECK (secondary_unit IS NULL OR secondary_unit IN ('grams', 'ounces', 'metres', 'yards', 'skeins', 'balls', 'pieces'));

ALTER TABLE materials ADD COLUMN IF NOT EXISTS secondary_quantity_owned NUMERIC DEFAULT NULL
  CHECK (secondary_quantity_owned IS NULL OR secondary_quantity_owned >= 0);

ALTER TABLE materials ADD COLUMN IF NOT EXISTS secondary_quantity_used NUMERIC DEFAULT 0
  CHECK (secondary_quantity_used IS NULL OR secondary_quantity_used >= 0);
