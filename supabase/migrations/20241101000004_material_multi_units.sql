-- Allow unlimited tracking units on materials (not just primary + secondary)
-- Uses a JSONB array to store multiple unit measurements

ALTER TABLE materials ADD COLUMN IF NOT EXISTS tracking_units jsonb NOT NULL DEFAULT '[]';

-- tracking_units format:
-- [
--   { "unit": "grams", "quantity_owned": 100, "quantity_used": 25 },
--   { "unit": "yards", "quantity_owned": 450, "quantity_used": 120 },
--   { "unit": "balls", "quantity_owned": 2, "quantity_used": 0.5 }
-- ]

-- Also add a link to expenses for auto-creating expense when adding material
ALTER TABLE materials ADD COLUMN IF NOT EXISTS linked_expense_id uuid REFERENCES purchases(id) ON DELETE SET NULL;
