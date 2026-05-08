-- Migration: Business Suite tables, RLS, indexes, RPC functions, and storage
-- Adds subscription tier, suppliers, purchases, materials, products, BOM,
-- customers, sales, and junction tables for the Business Suite feature.

-- ============================================================
-- 1. Modify user_settings: add subscription_tier
-- ============================================================
ALTER TABLE user_settings
  ADD COLUMN subscription_tier varchar(10) NOT NULL DEFAULT 'free'
  CHECK (subscription_tier IN ('free', 'pro'));

-- ============================================================
-- 2. suppliers
-- ============================================================
CREATE TABLE suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name varchar(255) NOT NULL,
  website varchar(500),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. purchases (expenses)
-- ============================================================
CREATE TABLE purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  supplier_id uuid REFERENCES suppliers ON DELETE SET NULL,
  purchase_date date NOT NULL,
  description varchar(500) NOT NULL,
  category varchar(30) NOT NULL CHECK (category IN ('equipment', 'stock', 'subscription', 'books', 'office_supplies')),
  cost decimal(10,2) NOT NULL CHECK (cost >= 0),
  invoice_path text,
  invoice_file_name varchar(255),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. materials
-- ============================================================
CREATE TABLE materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name varchar(255) NOT NULL,
  material_type varchar(50),
  category varchar(20) NOT NULL CHECK (category IN ('yarn', 'accessories', 'hardware', 'tools')),
  colour varchar(100),
  quantity_owned decimal(10,2) NOT NULL DEFAULT 0,
  quantity_used decimal(10,2) NOT NULL DEFAULT 0,
  total_cost decimal(10,2),
  cost_per_unit decimal(10,4) GENERATED ALWAYS AS (
    CASE WHEN quantity_owned > 0 AND total_cost IS NOT NULL
      THEN total_cost / quantity_owned
      ELSE NULL
    END
  ) STORED,
  unit varchar(20) NOT NULL DEFAULT 'pieces' CHECK (unit IN ('grams', 'metres', 'pieces', 'skeins')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. products
-- ============================================================
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name varchar(255) NOT NULL,
  description text,
  sell_price decimal(10,2) NOT NULL CHECK (sell_price >= 0),
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discontinued')),
  photo_path text,
  time_taken_minutes integer CHECK (time_taken_minutes >= 0),
  wages_per_minute decimal(10,4),
  profit_margin_percent decimal(5,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. bom_line_items
-- ============================================================
CREATE TABLE bom_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products ON DELETE CASCADE NOT NULL,
  material_id uuid REFERENCES materials ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  quantity_required decimal(10,2) NOT NULL CHECK (quantity_required > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. customers
-- ============================================================
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name varchar(255) NOT NULL,
  email varchar(255),
  phone varchar(50),
  address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. sales
-- ============================================================
CREATE TABLE sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  product_id uuid REFERENCES products ON DELETE SET NULL,
  customer_id uuid REFERENCES customers ON DELETE SET NULL,
  sale_date date NOT NULL,
  quantity_sold integer NOT NULL DEFAULT 1 CHECK (quantity_sold > 0),
  sale_price decimal(10,2) NOT NULL CHECK (sale_price >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. product_projects (junction)
-- ============================================================
CREATE TABLE product_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, project_id)
);

-- ============================================================
-- 10. customer_projects (junction)
-- ============================================================
CREATE TABLE customer_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers ON DELETE SET NULL,
  project_id uuid REFERENCES projects ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(customer_id, project_id)
);

-- ============================================================
-- Enable RLS on all new tables
-- ============================================================
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_projects ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies: suppliers
-- ============================================================
CREATE POLICY "Users can view own suppliers"
  ON suppliers FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own suppliers"
  ON suppliers FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own suppliers"
  ON suppliers FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own suppliers"
  ON suppliers FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- RLS Policies: purchases
-- ============================================================
CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own purchases"
  ON purchases FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own purchases"
  ON purchases FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own purchases"
  ON purchases FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- RLS Policies: materials
-- ============================================================
CREATE POLICY "Users can view own materials"
  ON materials FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own materials"
  ON materials FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own materials"
  ON materials FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own materials"
  ON materials FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- RLS Policies: products
-- ============================================================
CREATE POLICY "Users can view own products"
  ON products FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own products"
  ON products FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own products"
  ON products FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- RLS Policies: bom_line_items
-- ============================================================
CREATE POLICY "Users can view own bom line items"
  ON bom_line_items FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own bom line items"
  ON bom_line_items FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own bom line items"
  ON bom_line_items FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own bom line items"
  ON bom_line_items FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- RLS Policies: customers
-- ============================================================
CREATE POLICY "Users can view own customers"
  ON customers FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own customers"
  ON customers FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own customers"
  ON customers FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own customers"
  ON customers FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- RLS Policies: sales
-- ============================================================
CREATE POLICY "Users can view own sales"
  ON sales FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sales"
  ON sales FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sales"
  ON sales FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own sales"
  ON sales FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- RLS Policies: product_projects
-- ============================================================
CREATE POLICY "Users can view own product projects"
  ON product_projects FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own product projects"
  ON product_projects FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own product projects"
  ON product_projects FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own product projects"
  ON product_projects FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- RLS Policies: customer_projects
-- ============================================================
CREATE POLICY "Users can view own customer projects"
  ON customer_projects FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own customer projects"
  ON customer_projects FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own customer projects"
  ON customer_projects FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own customer projects"
  ON customer_projects FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- Indexes on foreign keys
-- ============================================================
CREATE INDEX idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchases_supplier_id ON purchases(supplier_id);
CREATE INDEX idx_purchases_category ON purchases(category);
CREATE INDEX idx_purchases_purchase_date ON purchases(purchase_date);
CREATE INDEX idx_materials_user_id ON materials(user_id);
CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_bom_line_items_product_id ON bom_line_items(product_id);
CREATE INDEX idx_bom_line_items_material_id ON bom_line_items(material_id);
CREATE INDEX idx_bom_line_items_user_id ON bom_line_items(user_id);
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_product_id ON sales(product_id);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_sale_date ON sales(sale_date);
CREATE INDEX idx_product_projects_product_id ON product_projects(product_id);
CREATE INDEX idx_product_projects_project_id ON product_projects(project_id);
CREATE INDEX idx_product_projects_user_id ON product_projects(user_id);
CREATE INDEX idx_customer_projects_customer_id ON customer_projects(customer_id);
CREATE INDEX idx_customer_projects_project_id ON customer_projects(project_id);
CREATE INDEX idx_customer_projects_user_id ON customer_projects(user_id);

-- ============================================================
-- RPC Functions for dashboard aggregation
-- ============================================================

-- Total expenses within date range
CREATE OR REPLACE FUNCTION get_total_expenses(
  p_user_id uuid,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
) RETURNS decimal
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(cost), 0)
  FROM purchases
  WHERE user_id = p_user_id
    AND (p_start_date IS NULL OR purchase_date >= p_start_date)
    AND (p_end_date IS NULL OR purchase_date <= p_end_date);
$$;

-- Total revenue within date range
CREATE OR REPLACE FUNCTION get_total_revenue(
  p_user_id uuid,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
) RETURNS decimal
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(sale_price), 0)
  FROM sales
  WHERE user_id = p_user_id
    AND (p_start_date IS NULL OR sale_date >= p_start_date)
    AND (p_end_date IS NULL OR sale_date <= p_end_date);
$$;

-- Expenses grouped by category
CREATE OR REPLACE FUNCTION get_expenses_by_category(
  p_user_id uuid,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
) RETURNS TABLE(category varchar, total decimal)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT category, COALESCE(SUM(cost), 0) as total
  FROM purchases
  WHERE user_id = p_user_id
    AND (p_start_date IS NULL OR purchase_date >= p_start_date)
    AND (p_end_date IS NULL OR purchase_date <= p_end_date)
  GROUP BY category
  ORDER BY total DESC;
$$;

-- Total stock value
CREATE OR REPLACE FUNCTION get_total_stock_value(p_user_id uuid)
RETURNS decimal
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(
    CASE WHEN quantity_owned > 0 AND total_cost IS NOT NULL
      THEN (total_cost / quantity_owned) * (quantity_owned - quantity_used)
      ELSE 0
    END
  ), 0)
  FROM materials
  WHERE user_id = p_user_id;
$$;

-- ============================================================
-- Storage bucket: invoices
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices',
  false,
  10485760, -- 10 MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
);

-- ============================================================
-- Storage policies: invoices
-- ============================================================
CREATE POLICY "Users can upload own invoices"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own invoices"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own invoices"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own invoices"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
