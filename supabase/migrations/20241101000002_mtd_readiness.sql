-- Phase C: MTD Readiness — placeholder tables for future HMRC API

-- Quarterly update tracking
CREATE TABLE IF NOT EXISTS hmrc_mtd_quarterly_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tax_year integer NOT NULL,
  quarter integer NOT NULL CHECK (quarter >= 1 AND quarter <= 4),
  period_start date NOT NULL,
  period_end date NOT NULL,
  deadline date NOT NULL,
  income decimal(10,2) NOT NULL DEFAULT 0,
  expenses decimal(10,2) NOT NULL DEFAULT 0,
  profit decimal(10,2) NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'draft', 'ready', 'submitted_manually', 'locked')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, tax_year, quarter)
);

ALTER TABLE hmrc_mtd_quarterly_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own quarterly updates" ON hmrc_mtd_quarterly_updates FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Future: HMRC API connection details (placeholder)
-- TODO: When HMRC vendor approval is obtained, store OAuth tokens here
CREATE TABLE IF NOT EXISTS hmrc_mtd_api_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  hmrc_utr varchar(20),
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  connected_at timestamptz,
  status varchar(20) NOT NULL DEFAULT 'not_connected' CHECK (status IN ('not_connected', 'pending', 'connected', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE hmrc_mtd_api_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own HMRC connection" ON hmrc_mtd_api_connections FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Future: HMRC obligations (placeholder)
-- TODO: Populated from HMRC API when connected
CREATE TABLE IF NOT EXISTS hmrc_mtd_obligations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  obligation_type varchar(20) NOT NULL DEFAULT 'quarterly',
  period_start date NOT NULL,
  period_end date NOT NULL,
  due_date date NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'open',
  hmrc_obligation_id varchar(100),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE hmrc_mtd_obligations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own obligations" ON hmrc_mtd_obligations FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Future: Submission attempts log (placeholder)
CREATE TABLE IF NOT EXISTS hmrc_mtd_submission_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quarterly_update_id uuid REFERENCES hmrc_mtd_quarterly_updates(id),
  submission_type varchar(20) NOT NULL,
  payload jsonb,
  response jsonb,
  status varchar(20) NOT NULL DEFAULT 'pending',
  submitted_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE hmrc_mtd_submission_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own submissions" ON hmrc_mtd_submission_attempts FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
