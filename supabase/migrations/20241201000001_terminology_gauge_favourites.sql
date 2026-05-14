-- Quick wins: terminology, gauge, favourites

-- Add terminology field to patterns
ALTER TABLE patterns ADD COLUMN IF NOT EXISTS terminology varchar(20) DEFAULT 'uk' CHECK (terminology IN ('uk', 'us', 'universal'));

-- Favourites/wishlist
CREATE TABLE IF NOT EXISTS pattern_favourites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_id uuid NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, pattern_id)
);

ALTER TABLE pattern_favourites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own favourites" ON pattern_favourites FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Gauge swatches
CREATE TABLE IF NOT EXISTS gauge_swatches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hook_size varchar(20) NOT NULL,
  yarn_weight varchar(30),
  yarn_name varchar(255),
  stitches_per_4in decimal(5,1) NOT NULL,
  rows_per_4in decimal(5,1),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE gauge_swatches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own gauge swatches" ON gauge_swatches FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
