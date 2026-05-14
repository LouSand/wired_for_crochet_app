-- Phase A: Enhanced SA103 — Tax config, expense adjustments, MTD thresholds

-- ─── Tax Configuration per user ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tax_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  accounting_basis varchar(20) NOT NULL DEFAULT 'cash' CHECK (accounting_basis IN ('cash', 'traditional')),
  personal_allowance decimal(10,2) NOT NULL DEFAULT 12570.00,
  basic_rate_threshold decimal(10,2) NOT NULL DEFAULT 50270.00,
  higher_rate_threshold decimal(10,2) NOT NULL DEFAULT 125140.00,
  class2_weekly_rate decimal(6,2) NOT NULL DEFAULT 3.45,
  class4_lower_threshold decimal(10,2) NOT NULL DEFAULT 12570.00,
  class4_upper_threshold decimal(10,2) NOT NULL DEFAULT 50270.00,
  class4_lower_rate decimal(4,2) NOT NULL DEFAULT 6.00,
  class4_upper_rate decimal(4,2) NOT NULL DEFAULT 2.00,
  qualifying_income decimal(10,2) DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tax_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tax config" ON tax_config FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─── Private-use adjustments on expenses ─────────────────────────────────────

ALTER TABLE purchases ADD COLUMN IF NOT EXISTS business_use_percentage integer NOT NULL DEFAULT 100 CHECK (business_use_percentage >= 0 AND business_use_percentage <= 100);
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS disallowable_amount decimal(10,2) NOT NULL DEFAULT 0;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS tax_adjustment_notes text DEFAULT NULL;

-- ─── MTD Thresholds (configurable) ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hmrc_mtd_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  threshold_amount decimal(10,2) NOT NULL,
  start_date date NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed current known thresholds
INSERT INTO hmrc_mtd_thresholds (threshold_amount, start_date, description) VALUES
  (50000, '2026-04-06', 'MTD for Income Tax — income over £50,000'),
  (30000, '2027-04-06', 'MTD for Income Tax — income over £30,000'),
  (20000, '2028-04-06', 'MTD for Income Tax — income over £20,000')
ON CONFLICT DO NOTHING;

-- ─── Year-end checklists ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tax_year_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tax_year integer NOT NULL,
  checklist_data jsonb NOT NULL DEFAULT '{}',
  status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'needs_review', 'ready', 'exported')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, tax_year)
);

ALTER TABLE tax_year_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own checklists" ON tax_year_checklists FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─── Accountant export log ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS accountant_export_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tax_year integer NOT NULL,
  export_type varchar(50) NOT NULL DEFAULT 'full_pack',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE accountant_export_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own export log" ON accountant_export_log FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
