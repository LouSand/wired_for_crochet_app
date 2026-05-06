/**
 * TypeScript types for the Business Suite feature.
 * Covers suppliers, purchases, materials, products, BOM, customers, sales,
 * and junction tables.
 */

// ============================================================
// Enum constants
// ============================================================

export const SUBSCRIPTION_TIERS = ['free', 'pro', 'pro_plus'] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

export const EXPENSE_CATEGORIES = [
  'equipment',
  'stock',
  'subscription',
  'books',
  'office_supplies',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const PRODUCT_STATUSES = ['active', 'discontinued'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const MATERIAL_CATEGORIES = ['yarn', 'accessories', 'hardware', 'tools'] as const;
export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

export const MATERIAL_UNITS = ['grams', 'metres', 'pieces', 'skeins'] as const;
export type MaterialUnit = (typeof MATERIAL_UNITS)[number];

// ============================================================
// Supplier types
// ============================================================

export interface SupplierRow {
  id: string;
  user_id: string;
  name: string;
  website: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupplierInsert {
  id?: string;
  user_id: string;
  name: string;
  website?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SupplierUpdate {
  id?: string;
  user_id?: string;
  name?: string;
  website?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ============================================================
// Purchase (expense) types
// ============================================================

export interface PurchaseRow {
  id: string;
  user_id: string;
  supplier_id: string | null;
  purchase_date: string;
  description: string;
  category: ExpenseCategory;
  cost: number;
  invoice_path: string | null;
  invoice_file_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseInsert {
  id?: string;
  user_id: string;
  supplier_id?: string | null;
  purchase_date: string;
  description: string;
  category: ExpenseCategory;
  cost: number;
  invoice_path?: string | null;
  invoice_file_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PurchaseUpdate {
  id?: string;
  user_id?: string;
  supplier_id?: string | null;
  purchase_date?: string;
  description?: string;
  category?: ExpenseCategory;
  cost?: number;
  invoice_path?: string | null;
  invoice_file_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ============================================================
// Material types
// ============================================================

export interface MaterialRow {
  id: string;
  user_id: string;
  name: string;
  material_type: string | null;
  category: MaterialCategory;
  colour: string | null;
  quantity_owned: number;
  quantity_used: number;
  total_cost: number | null;
  cost_per_unit: number | null;
  unit: MaterialUnit;
  created_at: string;
  updated_at: string;
}

export interface MaterialInsert {
  id?: string;
  user_id: string;
  name: string;
  material_type?: string | null;
  category: MaterialCategory;
  colour?: string | null;
  quantity_owned?: number;
  quantity_used?: number;
  total_cost?: number | null;
  unit?: MaterialUnit;
  created_at?: string;
  updated_at?: string;
}

export interface MaterialUpdate {
  id?: string;
  user_id?: string;
  name?: string;
  material_type?: string | null;
  category?: MaterialCategory;
  colour?: string | null;
  quantity_owned?: number;
  quantity_used?: number;
  total_cost?: number | null;
  unit?: MaterialUnit;
  created_at?: string;
  updated_at?: string;
}

// ============================================================
// Product types
// ============================================================

export interface ProductRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  sell_price: number;
  status: ProductStatus;
  photo_path: string | null;
  time_taken_minutes: number | null;
  wages_per_minute: number | null;
  profit_margin_percent: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProductInsert {
  id?: string;
  user_id: string;
  name: string;
  description?: string | null;
  sell_price: number;
  status?: ProductStatus;
  photo_path?: string | null;
  time_taken_minutes?: number | null;
  wages_per_minute?: number | null;
  profit_margin_percent?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProductUpdate {
  id?: string;
  user_id?: string;
  name?: string;
  description?: string | null;
  sell_price?: number;
  status?: ProductStatus;
  photo_path?: string | null;
  time_taken_minutes?: number | null;
  wages_per_minute?: number | null;
  profit_margin_percent?: number | null;
  created_at?: string;
  updated_at?: string;
}

// ============================================================
// BOM line item types
// ============================================================

export interface BomLineItemRow {
  id: string;
  product_id: string;
  material_id: string | null;
  user_id: string;
  quantity_required: number;
  created_at: string;
}

export interface BomLineItemInsert {
  id?: string;
  product_id: string;
  material_id: string;
  user_id: string;
  quantity_required: number;
  created_at?: string;
}

export interface BomLineItemUpdate {
  id?: string;
  product_id?: string;
  material_id?: string | null;
  user_id?: string;
  quantity_required?: number;
  created_at?: string;
}

// ============================================================
// Customer types
// ============================================================

export interface CustomerRow {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerInsert {
  id?: string;
  user_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerUpdate {
  id?: string;
  user_id?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ============================================================
// Sale types
// ============================================================

export interface SaleRow {
  id: string;
  user_id: string;
  product_id: string | null;
  customer_id: string | null;
  sale_date: string;
  quantity_sold: number;
  sale_price: number;
  created_at: string;
  updated_at: string;
}

export interface SaleInsert {
  id?: string;
  user_id: string;
  product_id?: string | null;
  customer_id?: string | null;
  sale_date: string;
  quantity_sold?: number;
  sale_price: number;
  created_at?: string;
  updated_at?: string;
}

export interface SaleUpdate {
  id?: string;
  user_id?: string;
  product_id?: string | null;
  customer_id?: string | null;
  sale_date?: string;
  quantity_sold?: number;
  sale_price?: number;
  created_at?: string;
  updated_at?: string;
}

// ============================================================
// Junction table types
// ============================================================

export interface ProductProjectRow {
  id: string;
  product_id: string;
  project_id: string;
  user_id: string;
  created_at: string;
}

export interface ProductProjectInsert {
  id?: string;
  product_id: string;
  project_id: string;
  user_id: string;
  created_at?: string;
}

export interface CustomerProjectRow {
  id: string;
  customer_id: string | null;
  project_id: string;
  user_id: string;
  created_at: string;
}

export interface CustomerProjectInsert {
  id?: string;
  customer_id: string;
  project_id: string;
  user_id: string;
  created_at?: string;
}

// ============================================================
// BOM cost breakdown interface
// ============================================================

export interface BomCostBreakdown {
  material_cost: number;
  labour_cost: number;
  extras_total: number;
  total_production_cost: number;
  profit_margin_amount: number;
  suggested_sell_price: number;
  invalid_line_items: number;
}

// ============================================================
// Dashboard metrics interface
// ============================================================

export interface DashboardMetrics {
  total_expenses: number;
  total_revenue: number;
  profit_or_loss: number;
  expenses_by_category: Array<{ category: ExpenseCategory; total: number }>;
  total_stock_value: number;
  top_products: Array<{ product_id: string; name: string; total_revenue: number }>;
}

// ============================================================
// Filter interfaces
// ============================================================

export interface ExpenseFilters {
  category?: ExpenseCategory;
  supplier_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface SaleFilters {
  product_id?: string;
  customer_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface MaterialFilters {
  category?: MaterialCategory;
}
