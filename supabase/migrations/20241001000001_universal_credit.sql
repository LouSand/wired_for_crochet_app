-- Universal Credit Reporting Helper
-- Tracks monthly UC reporting periods, income, expenses, and evidence

-- ─── UC Reporting Periods ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS uc_reporting_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  submission_due date NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready_to_review', 'submitted', 'locked')),
  notes text,
  submitted_at timestamptz,
  locked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_start)
);

ALTER TABLE uc_reporting_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own UC periods" ON uc_reporting_periods FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─── UC Income Entries ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS uc_income_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES uc_reporting_periods(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  date_received date NOT NULL,
  source varchar(255) NOT NULL,
  payment_method varchar(50),
  linked_invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE uc_income_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own UC income" ON uc_income_entries FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─── UC Expense Entries ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS uc_expense_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES uc_reporting_periods(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  date_incurred date NOT NULL,
  category varchar(50) NOT NULL CHECK (category IN (
    'materials', 'mileage_travel', 'equipment', 'insurance',
    'office_costs', 'phone_internet', 'advertising',
    'professional_fees', 'other_allowable'
  )),
  supplier varchar(255),
  description varchar(500) NOT NULL,
  linked_expense_id uuid REFERENCES purchases(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE uc_expense_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own UC expenses" ON uc_expense_entries FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─── UC Evidence Files ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS uc_evidence_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_id uuid REFERENCES uc_reporting_periods(id) ON DELETE SET NULL,
  income_entry_id uuid REFERENCES uc_income_entries(id) ON DELETE SET NULL,
  expense_entry_id uuid REFERENCES uc_expense_entries(id) ON DELETE SET NULL,
  file_path text NOT NULL,
  file_name varchar(255) NOT NULL,
  file_size integer NOT NULL,
  mime_type varchar(100) NOT NULL,
  tags text[] DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE uc_evidence_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own UC evidence" ON uc_evidence_files FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─── UC Audit Trail ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS uc_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_id uuid REFERENCES uc_reporting_periods(id) ON DELETE SET NULL,
  action varchar(50) NOT NULL,
  entity_type varchar(50) NOT NULL,
  entity_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE uc_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own UC audit log" ON uc_audit_log FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users create own UC audit entries" ON uc_audit_log FOR INSERT WITH CHECK (user_id = auth.uid());

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_uc_periods_user_date ON uc_reporting_periods(user_id, period_start);
CREATE INDEX IF NOT EXISTS idx_uc_income_period ON uc_income_entries(period_id);
CREATE INDEX IF NOT EXISTS idx_uc_expenses_period ON uc_expense_entries(period_id);
CREATE INDEX IF NOT EXISTS idx_uc_evidence_period ON uc_evidence_files(period_id);
CREATE INDEX IF NOT EXISTS idx_uc_evidence_income ON uc_evidence_files(income_entry_id);
CREATE INDEX IF NOT EXISTS idx_uc_evidence_expense ON uc_evidence_files(expense_entry_id);
CREATE INDEX IF NOT EXISTS idx_uc_audit_period ON uc_audit_log(period_id);
