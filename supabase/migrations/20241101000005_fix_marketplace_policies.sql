-- Fix pattern_purchases: add INSERT policy for buyers
DROP POLICY IF EXISTS "Buyers can insert purchases" ON pattern_purchases;
CREATE POLICY "Buyers can insert purchases" ON pattern_purchases
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());

-- Fix pattern_purchases: add UPDATE policy
DROP POLICY IF EXISTS "Buyers can update own purchases" ON pattern_purchases;
CREATE POLICY "Buyers can update own purchases" ON pattern_purchases
  FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid());

-- Ensure patterns UPDATE policy allows owners to publish
-- (The existing "Users can update own patterns" policy should cover this,
-- but let's make sure it exists)
DROP POLICY IF EXISTS "Users can update own patterns" ON patterns;
CREATE POLICY "Users can update own patterns" ON patterns
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Ensure seller_profiles INSERT policy exists
DROP POLICY IF EXISTS "Users can insert own seller profile" ON seller_profiles;
CREATE POLICY "Users can insert own seller profile" ON seller_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
