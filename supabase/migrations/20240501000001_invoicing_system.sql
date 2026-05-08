-- Migration: Invoicing System tables, RLS, indexes, and storage
-- Adds pro_plus tier, business_profile, invoices, quotes, payments, email_logs
-- and business-assets storage bucket for the Invoicing System feature.

-- ============================================================
-- 1. Update subscription_tier CHECK to include 'pro_plus'
-- ============================================================
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_subscription_tier_check;
ALTER TABLE user_settings ADD CONSTRAINT user_settings_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'pro', 'pro_plus'));

-- ============================================================
-- 2. Add business_profile JSONB column to user_settings
-- ============================================================
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS business_profile jsonb DEFAULT NULL;

-- ============================================================
-- 3. Create invoices table
-- ============================================================
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  customer_id uuid REFERENCES customers ON DELETE RESTRICT NOT NULL,
  project_id uuid REFERENCES projects ON DELETE SET NULL,
  invoice_number varchar(20) NOT NULL,
  issue_date date NOT NULL,
  due_date date NOT NULL,
  total decimal(10,2) NOT NULL DEFAULT 0,
  amount_paid decimal(10,2) NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'unpaid', 'partial', 'paid', 'overdue')),
  deposit_percent integer NOT NULL DEFAULT 40,
  stage2_percent integer NOT NULL DEFAULT 40,
  final_percent integer NOT NULL DEFAULT 20,
  quote_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, invoice_number),
  CHECK (deposit_percent + stage2_percent + final_percent = 100),
  CHECK (deposit_percent >= 0 AND stage2_percent >= 0 AND final_percent >= 0)
);

-- ============================================================
-- 4. Create invoice_items table
-- ============================================================
CREATE TABLE invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  description varchar(500) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price decimal(10,2) NOT NULL CHECK (unit_price > 0),
  line_total decimal(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. Create quotes table
-- ============================================================
CREATE TABLE quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  customer_id uuid REFERENCES customers ON DELETE RESTRICT NOT NULL,
  quote_number varchar(20) NOT NULL,
  issue_date date NOT NULL,
  total decimal(10,2) NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, quote_number)
);

-- Add quote_id FK after quotes table exists
ALTER TABLE invoices ADD CONSTRAINT invoices_quote_id_fkey
  FOREIGN KEY (quote_id) REFERENCES quotes ON DELETE SET NULL;

-- ============================================================
-- 6. Create quote_items table
-- ============================================================
CREATE TABLE quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid REFERENCES quotes ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  description varchar(500) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price decimal(10,2) NOT NULL CHECK (unit_price > 0),
  line_total decimal(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. Create payments table
-- ============================================================
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. Create email_logs table
-- ============================================================
CREATE TABLE email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  document_type varchar(20) NOT NULL CHECK (document_type IN ('invoice', 'quote')),
  document_id uuid NOT NULL,
  recipient varchar(255) NOT NULL,
  subject varchar(255),
  sent_at timestamptz NOT NULL DEFAULT now(),
  send_count integer NOT NULL DEFAULT 1
);

-- ============================================================
-- 9. Enable RLS on all new tables
-- ============================================================
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Invoices policies
CREATE POLICY "Users can view own invoices" ON invoices
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own invoices" ON invoices
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own invoices" ON invoices
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own invoices" ON invoices
  FOR DELETE USING (user_id = auth.uid());

-- Invoice items policies
CREATE POLICY "Users can view own invoice items" ON invoice_items
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own invoice items" ON invoice_items
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own invoice items" ON invoice_items
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own invoice items" ON invoice_items
  FOR DELETE USING (user_id = auth.uid());

-- Quotes policies
CREATE POLICY "Users can view own quotes" ON quotes
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own quotes" ON quotes
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own quotes" ON quotes
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own quotes" ON quotes
  FOR DELETE USING (user_id = auth.uid());

-- Quote items policies
CREATE POLICY "Users can view own quote items" ON quote_items
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own quote items" ON quote_items
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own quote items" ON quote_items
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own quote items" ON quote_items
  FOR DELETE USING (user_id = auth.uid());

-- Payments policies
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own payments" ON payments
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own payments" ON payments
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own payments" ON payments
  FOR DELETE USING (user_id = auth.uid());

-- Email logs policies
CREATE POLICY "Users can view own email logs" ON email_logs
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own email logs" ON email_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own email logs" ON email_logs
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own email logs" ON email_logs
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- 10. Create indexes
-- ============================================================
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_quotes_user_id ON quotes(user_id);
CREATE INDEX idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX idx_email_logs_document ON email_logs(document_type, document_id);

-- ============================================================
-- 11. Storage bucket for business assets (logos)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-assets',
  'business-assets',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png']
);

-- Storage policies: business-assets
CREATE POLICY "Users can upload own business assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'business-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own business assets"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'business-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own business assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'business-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own business assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'business-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
