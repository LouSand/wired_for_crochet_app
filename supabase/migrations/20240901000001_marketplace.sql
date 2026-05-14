-- Phase 9 & 10: Community sharing and marketplace

-- Seller profiles
CREATE TABLE IF NOT EXISTS seller_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name varchar(100) NOT NULL,
  slug varchar(100) NOT NULL UNIQUE,
  bio text,
  avatar_path text,
  stripe_account_id varchar(255),
  stripe_onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own seller profile" ON seller_profiles FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
-- Public read for marketplace browsing
CREATE POLICY "Anyone can view seller profiles" ON seller_profiles FOR SELECT USING (true);

-- Add marketplace columns to patterns
ALTER TABLE patterns ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;
ALTER TABLE patterns ADD COLUMN IF NOT EXISTS price decimal(10,2) DEFAULT NULL;
ALTER TABLE patterns ADD COLUMN IF NOT EXISTS currency varchar(3) DEFAULT 'GBP';
ALTER TABLE patterns ADD COLUMN IF NOT EXISTS slug varchar(255) DEFAULT NULL;
ALTER TABLE patterns ADD COLUMN IF NOT EXISTS preview_description text DEFAULT NULL;
ALTER TABLE patterns ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE patterns ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;
ALTER TABLE patterns ADD COLUMN IF NOT EXISTS purchase_count integer NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_patterns_slug ON patterns(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patterns_published ON patterns(is_published) WHERE is_published = true;

-- Pattern purchases
CREATE TABLE IF NOT EXISTS pattern_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_id uuid NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id),
  amount decimal(10,2) NOT NULL DEFAULT 0,
  commission decimal(10,2) NOT NULL DEFAULT 0,
  currency varchar(3) NOT NULL DEFAULT 'GBP',
  stripe_payment_id varchar(255),
  status varchar(20) NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(buyer_id, pattern_id)
);

ALTER TABLE pattern_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyers can view own purchases" ON pattern_purchases FOR SELECT USING (buyer_id = auth.uid());
CREATE POLICY "Sellers can view sales" ON pattern_purchases FOR SELECT USING (seller_id = auth.uid());

-- Pattern reviews
CREATE TABLE IF NOT EXISTS pattern_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id uuid NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(pattern_id, reviewer_id)
);

ALTER TABLE pattern_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reviews" ON pattern_reviews FOR SELECT USING (true);
CREATE POLICY "Users can manage own reviews" ON pattern_reviews FOR ALL USING (reviewer_id = auth.uid()) WITH CHECK (reviewer_id = auth.uid());

-- Pattern reports (content moderation)
CREATE TABLE IF NOT EXISTS pattern_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id uuid NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason varchar(50) NOT NULL,
  details text,
  status varchar(20) NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pattern_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create reports" ON pattern_reports FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Users can view own reports" ON pattern_reports FOR SELECT USING (reporter_id = auth.uid());

-- Public read policy for published patterns (anyone can browse marketplace)
CREATE POLICY "Anyone can view published patterns" ON patterns FOR SELECT USING (is_published = true);
