# Implementation Plan: Business Suite

## Overview

This plan implements the Business Suite as a premium extension to the existing "Wired for Crochet" project tracker. It adds subscription tier gating, expense tracking, product catalog, enhanced materials inventory, bill of materials costing, customer/supplier databases, sales recording, and a business dashboard. Implementation follows existing patterns: server actions with Zod validation, Supabase RLS, Tailwind UI, and Next.js App Router conventions.

## Tasks

- [x] 1. Database migration and storage setup
  - [x] 1.1 Create SQL migration for user_settings modification and new tables
    - Add `subscription_tier` column (varchar(10), NOT NULL, DEFAULT 'free', CHECK IN ('free','pro')) to `user_settings`
    - Create `suppliers` table with id, user_id, name, website, notes, timestamps
    - Create `purchases` table with id, user_id, supplier_id (FK nullable), purchase_date, description, category (CHECK enum), cost, invoice_path, invoice_file_name, timestamps
    - Create `materials` table with id, user_id, name, material_type, category (CHECK enum), colour, quantity_owned, quantity_used, total_cost, cost_per_unit (GENERATED STORED), unit (CHECK enum), timestamps
    - Create `products` table with id, user_id, name, description, sell_price, status (CHECK enum), photo_path, time_taken_minutes, wages_per_minute, profit_margin_percent, timestamps
    - Create `bom_line_items` table with id, product_id (FK CASCADE), material_id (FK SET NULL), user_id, quantity_required, created_at
    - Create `customers` table with id, user_id, name, email, phone, address, notes, timestamps
    - Create `sales` table with id, user_id, product_id (FK nullable), customer_id (FK nullable), sale_date, quantity_sold, sale_price, timestamps
    - Create `product_projects` junction table with UNIQUE(product_id, project_id)
    - Create `customer_projects` junction table with UNIQUE(customer_id, project_id)
    - Enable RLS on all new tables with `user_id = auth.uid()` policies
    - _Requirements: 1.1, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 4.3, 4.7, 5.1, 6.1, 7.1, 9.1_

  - [x] 1.2 Create RPC functions for dashboard aggregation
    - Create `get_total_expenses(p_user_id, p_start_date, p_end_date)` function
    - Create `get_total_revenue(p_user_id, p_start_date, p_end_date)` function
    - Create `get_expenses_by_category(p_user_id, p_start_date, p_end_date)` function
    - Create `get_total_stock_value(p_user_id)` function
    - All functions use SECURITY DEFINER
    - _Requirements: 8.1, 8.2, 8.4, 8.6, 8.7_

  - [x] 1.3 Create Supabase Storage bucket for invoices
    - Create `invoices` private bucket
    - Configure max file size 10 MB
    - Allow MIME types: application/pdf, image/jpeg, image/png
    - Add RLS policy so users can only access their own files
    - _Requirements: 10.1, 10.2, 10.5_

- [x] 2. TypeScript types and Zod validators
  - [x] 2.1 Create business suite TypeScript types in `src/types/business.ts`
    - Define Row, Insert, Update types for: suppliers, purchases, materials, products, bom_line_items, customers, sales, product_projects, customer_projects
    - Define BomCostBreakdown, DashboardMetrics, ExpenseFilters, SaleFilters, MaterialFilters interfaces
    - Define enum constants for subscription_tier, expense category, product status, material category, material unit
    - _Requirements: 1.1, 2.2, 3.2, 4.2, 4.7_

  - [x] 2.2 Create Zod validators for supplier in `src/lib/validators/supplier.ts`
    - Define `supplierFormSchema` with name (required, max 255), website (optional, max 500), notes (optional)
    - Define `supplierUpdateSchema` as partial
    - _Requirements: 7.1, 7.6_

  - [x] 2.3 Create Zod validators for expense/purchase in `src/lib/validators/expense.ts`
    - Define `purchaseFormSchema` with purchase_date (required ISO date), description (required, max 500), category (required enum), cost (required, non-negative), supplier_id (optional UUID), invoice_path (optional)
    - Define `purchaseUpdateSchema` as partial
    - _Requirements: 2.1, 2.2, 2.9_

  - [x] 2.4 Create Zod validators for material in `src/lib/validators/material.ts`
    - Define `materialFormSchema` with name (required, max 255), material_type (optional), category (required enum), colour (optional), quantity_owned (non-negative), quantity_used (non-negative), total_cost (optional, non-negative), unit (required enum)
    - Define `materialUpdateSchema` as partial
    - _Requirements: 4.1, 4.2, 4.7, 4.9_

  - [x] 2.5 Create Zod validators for product in `src/lib/validators/product.ts`
    - Define `productFormSchema` with name (required, max 255), description (optional), sell_price (required, non-negative), status (enum, default 'active'), photo_path (optional), time_taken_minutes (optional, non-negative integer), wages_per_minute (optional, non-negative), profit_margin_percent (optional, non-negative)
    - Define `productUpdateSchema` as partial
    - _Requirements: 3.1, 3.2, 3.7_

  - [x] 2.6 Create Zod validators for BOM in `src/lib/validators/bom.ts`
    - Define `bomLineItemFormSchema` with material_id (required UUID), quantity_required (required, positive)
    - Define `bomLineItemUpdateSchema` as partial
    - _Requirements: 5.1_

  - [x] 2.7 Create Zod validators for customer in `src/lib/validators/customer.ts`
    - Define `customerFormSchema` with name (required, max 255), email (optional, valid email format), phone (optional, max 50), address (optional), notes (optional)
    - Define `customerUpdateSchema` as partial
    - _Requirements: 6.1, 6.6_

  - [x] 2.8 Create Zod validators for sale in `src/lib/validators/sale.ts`
    - Define `saleFormSchema` with sale_date (required ISO date), product_id (optional UUID), customer_id (optional UUID), quantity_sold (required, positive integer), sale_price (required, non-negative)
    - Define `saleUpdateSchema` as partial
    - _Requirements: 9.1, 9.5_

  - [ ]* 2.9 Write property tests for enum and required field validators
    - **Property 11: Enum field validation** — test that subscription_tier, expense category, product status, material category, and material unit validators accept only valid values and reject all others
    - **Property 12: Required field validation rejects incomplete data** — test that validators reject inputs missing required fields
    - **Validates: Requirements 1.1, 2.2, 2.9, 3.2, 3.7, 4.2, 4.7, 4.9, 6.6, 7.6, 9.5**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Tier gating infrastructure
  - [x] 4.1 Create tier gate helper in `src/lib/actions/business-gate.ts`
    - Implement `getSubscriptionTier()` that queries user_settings for current user
    - Implement `assertProTier()` that throws/returns error if tier !== 'pro'
    - _Requirements: 1.1, 1.7_

  - [x] 4.2 Create TierGate server component in `src/components/business/TierGate.tsx`
    - Accept children and optional fallback prop
    - Query subscription_tier from user_settings
    - Render children if tier === 'pro', otherwise render UpgradePrompt
    - _Requirements: 1.2, 1.3_

  - [x] 4.3 Create UpgradePrompt component in `src/components/business/UpgradePrompt.tsx`
    - Display feature name and upgrade CTA
    - Styled with Tailwind, consistent with existing app design
    - _Requirements: 1.2_

  - [x] 4.4 Create business layout with tier gate at `src/app/(dashboard)/business/layout.tsx`
    - Wrap all business routes with TierGate component
    - Add "Business" section to sidebar navigation
    - _Requirements: 1.2, 1.3, 1.5, 1.6_

  - [ ]* 4.5 Write property test for tier gate server action enforcement
    - **Property 17: Tier gate server action enforcement** — verify that all business server actions return authorization error for free-tier users without performing mutations
    - **Validates: Requirements 1.7**

- [ ] 5. Supplier management
  - [x] 5.1 Create supplier server actions in `src/lib/actions/suppliers.ts`
    - Implement `createSupplier`, `updateSupplier`, `deleteSupplier`, `getSuppliers` (with search)
    - Each action calls `assertProTier()` before mutations
    - Delete sets supplier_id to NULL on linked purchases
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 7.6, 7.7_

  - [x] 5.2 Create supplier list page at `src/app/(dashboard)/business/suppliers/page.tsx`
    - Display all suppliers with name, website
    - Include search input for filtering by name
    - Link to supplier detail pages
    - _Requirements: 7.4_

  - [x] 5.3 Create supplier detail page at `src/app/(dashboard)/business/suppliers/[id]/page.tsx`
    - Display supplier info and linked purchase history
    - Include edit and delete actions
    - _Requirements: 7.3, 7.5_

  - [x] 5.4 Create SupplierForm component in `src/components/business/SupplierForm.tsx`
    - Form fields: name (required), website, notes
    - Reusable for create and edit flows
    - Uses Zod validation with inline field errors
    - _Requirements: 7.1, 7.6_

  - [x] 5.5 Create new supplier page at `src/app/(dashboard)/business/suppliers/new/page.tsx`
    - Render SupplierForm for creation
    - _Requirements: 7.1_

  - [ ]* 5.6 Write property test for supplier search
    - **Property 15: Supplier search by name** — verify case-insensitive substring matching returns correct results
    - **Validates: Requirements 7.4**

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Expense and purchase tracking
  - [x] 7.1 Create expense server actions in `src/lib/actions/expenses.ts`
    - Implement `createExpense`, `updateExpense`, `deleteExpense`, `getExpenses` (with filters for category, supplier, date range)
    - Each action calls `assertProTier()` before mutations
    - Delete also removes associated invoice file from storage
    - _Requirements: 2.1, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [x] 7.2 Create InvoiceUploader component in `src/components/business/InvoiceUploader.tsx`
    - Client-side pre-validation of MIME type (PDF, JPEG, PNG) and file size (≤ 10 MB)
    - Upload to Supabase Storage `invoices` bucket
    - Return file path on success
    - Display error for unsupported formats or oversized files
    - _Requirements: 2.3, 10.1, 10.2, 10.4_

  - [x] 7.3 Create ExpenseForm component in `src/components/business/ExpenseForm.tsx`
    - Form fields: purchase_date, description, category (dropdown), cost, supplier (dropdown), invoice upload
    - Reusable for create and edit
    - Uses Zod validation with inline field errors
    - _Requirements: 2.1, 2.2, 2.9_

  - [x] 7.4 Create expense list page at `src/app/(dashboard)/business/expenses/page.tsx`
    - Display all purchases with date, description, category, cost
    - Filter controls for category, supplier, date range
    - Show running total of expenses
    - _Requirements: 2.5, 2.6, 2.7, 2.8_

  - [x] 7.5 Create new expense page at `src/app/(dashboard)/business/expenses/new/page.tsx`
    - Render ExpenseForm for creation
    - _Requirements: 2.1_

  - [ ] 7.6 Create expense edit/detail functionality
    - Allow viewing invoice attachment (signed URL download link)
    - Allow editing and deleting expenses
    - _Requirements: 2.10, 10.3_

  - [ ]* 7.7 Write property tests for expense filtering
    - **Property 4: Expense filtering preserves predicate** — verify that filtered results match the filter criteria exactly
    - **Validates: Requirements 2.6, 2.7, 2.8**

  - [ ]* 7.8 Write property test for invoice file validation
    - **Property 16: Invoice file validation** — verify MIME type and size constraints
    - **Validates: Requirements 10.1, 10.2, 10.4**

- [ ] 8. Materials inventory
  - [x] 8.1 Create material server actions in `src/lib/actions/materials.ts`
    - Implement `createMaterial`, `updateMaterial`, `deleteMaterial`, `getMaterials` (with filters)
    - Each action calls `assertProTier()` before mutations
    - cost_per_unit is auto-calculated by the database (GENERATED column)
    - _Requirements: 4.1, 4.3, 4.4, 4.5, 4.6, 4.8, 4.9_

  - [x] 8.2 Create MaterialForm component in `src/components/business/MaterialForm.tsx`
    - Form fields: name (required), material_type, category (dropdown), colour, quantity_owned, quantity_used, total_cost, unit (dropdown)
    - Display computed cost_per_unit (read-only)
    - Display available stock (quantity_owned - quantity_used)
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.7_

  - [x] 8.3 Create materials list page at `src/app/(dashboard)/business/materials/page.tsx`
    - Display all materials with name, category, quantity, cost_per_unit, available stock
    - Filter by category
    - _Requirements: 4.1, 4.5, 4.6_

  - [x] 8.4 Create new material page at `src/app/(dashboard)/business/materials/new/page.tsx`
    - Render MaterialForm for creation
    - _Requirements: 4.1_

  - [ ] 8.5 Create material edit functionality
    - Allow editing and deleting materials
    - Recalculation of cost_per_unit happens automatically via GENERATED column
    - _Requirements: 4.4, 4.8_

  - [ ]* 8.6 Write property tests for cost-per-unit and available stock
    - **Property 2: Cost-per-unit auto-calculation** — verify total_cost / quantity_owned when both > 0, null otherwise
    - **Property 3: Available stock computation** — verify quantity_owned - quantity_used
    - **Validates: Requirements 4.3, 4.4, 4.5, 4.6**

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Product catalog
  - [x] 10.1 Create product server actions in `src/lib/actions/business-products.ts`
    - Implement `createProduct`, `updateProduct`, `deleteProduct`, `getProducts` (with includeDiscontinued flag)
    - Implement `linkProductToProject` for product-project association
    - Each action calls `assertProTier()` before mutations
    - Default listing excludes discontinued products unless flag is set
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 3.7_

  - [x] 10.2 Create ProductForm component in `src/components/business/ProductForm.tsx`
    - Form fields: name (required), description, sell_price (required), status (dropdown), photo_path, time_taken_minutes, wages_per_minute, profit_margin_percent
    - _Requirements: 3.1, 3.2, 3.7_

  - [x] 10.3 Create product list page at `src/app/(dashboard)/business/products/page.tsx`
    - Display active products with name, sell_price, status
    - Toggle to show/hide discontinued products
    - _Requirements: 3.2, 3.3_

  - [x] 10.4 Create new product page at `src/app/(dashboard)/business/products/new/page.tsx`
    - Render ProductForm for creation
    - _Requirements: 3.1_

  - [x] 10.5 Create product detail page at `src/app/(dashboard)/business/products/[id]/page.tsx`
    - Display product info, linked projects, and BOM summary
    - Include edit, delete, and link-to-project actions
    - _Requirements: 3.4, 3.5, 3.6_

  - [ ]* 10.6 Write property test for discontinued product exclusion
    - **Property 13: Discontinued products excluded from active listing** — verify only active products appear in default listing
    - **Validates: Requirements 3.3**

- [ ] 11. Bill of materials (BOM)
  - [x] 11.1 Create BOM calculator pure function in `src/lib/bom-calculator.ts`
    - Implement `calculateBomCost` function per design specification
    - Compute material_cost, labour_cost, extras_total, total_production_cost, profit_margin_amount, suggested_sell_price
    - Track invalid_line_items count (null material_id)
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.8_

  - [ ] 11.2 Create BOM server actions in `src/lib/actions/bom.ts`
    - Implement `addBomLineItem`, `updateBomLineItem`, `removeBomLineItem`, `getBomForProduct`, `calculateBomCost` (server-side)
    - Each action calls `assertProTier()` before mutations
    - Fetch material cost_per_unit for each line item when calculating
    - _Requirements: 5.1, 5.7, 5.8_

  - [ ] 11.3 Create BomEditor component in `src/components/business/BomEditor.tsx`
    - Add/remove/edit BOM line items
    - Material selector dropdown with available materials
    - Quantity input per line item
    - Flag invalid line items (deleted materials) with warning
    - _Requirements: 5.1, 5.8_

  - [ ] 11.4 Create BomBreakdown component in `src/components/business/BomBreakdown.tsx`
    - Display material_cost, labour_cost, extras_total, total_production_cost, suggested_sell_price
    - Show invalid_line_items warning count
    - _Requirements: 5.9_

  - [ ] 11.5 Create BOM page at `src/app/(dashboard)/business/products/[id]/bom/page.tsx`
    - Render BomEditor and BomBreakdown for the product
    - Allow setting time_taken_minutes, wages_per_minute, profit_margin_percent
    - Allow adding extra cost line items
    - _Requirements: 5.1, 5.3, 5.4, 5.5, 5.6, 5.9_

  - [ ]* 11.6 Write property test for BOM cost calculation
    - **Property 1: BOM cost calculation correctness** — verify material_cost, labour_cost, extras_total, total_production_cost, suggested_sell_price, and invalid_line_items calculations
    - **Validates: Requirements 5.2, 5.3, 5.4, 5.5, 5.6, 5.8**

- [ ] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Customer database
  - [ ] 13.1 Create customer server actions in `src/lib/actions/customers.ts`
    - Implement `createCustomer`, `updateCustomer`, `deleteCustomer`, `getCustomers` (with search)
    - Implement `linkCustomerToProject` for customer-project association
    - Each action calls `assertProTier()` before mutations
    - Delete removes customer_projects junction records but preserves projects
    - _Requirements: 6.1, 6.2, 6.4, 6.5, 6.6, 6.7_

  - [ ] 13.2 Create CustomerForm component in `src/components/business/CustomerForm.tsx`
    - Form fields: name (required), email, phone, address, notes
    - Reusable for create and edit
    - Uses Zod validation with inline field errors
    - _Requirements: 6.1, 6.6_

  - [ ] 13.3 Create customer list page at `src/app/(dashboard)/business/customers/page.tsx`
    - Display all customers with name, email
    - Include search input for filtering by name or email
    - _Requirements: 6.4_

  - [ ] 13.4 Create customer detail page at `src/app/(dashboard)/business/customers/[id]/page.tsx`
    - Display customer info and linked projects (order history)
    - Include edit, delete, and link-to-project actions
    - _Requirements: 6.2, 6.3, 6.5_

  - [ ] 13.5 Create new customer page at `src/app/(dashboard)/business/customers/new/page.tsx`
    - Render CustomerForm for creation
    - _Requirements: 6.1_

  - [ ]* 13.6 Write property test for customer search
    - **Property 14: Customer search by name or email** — verify case-insensitive substring matching returns correct results
    - **Validates: Requirements 6.4**

- [ ] 14. Sales and revenue tracking
  - [ ] 14.1 Create sales server actions in `src/lib/actions/sales.ts`
    - Implement `createSale`, `updateSale`, `deleteSale`, `getSales` (with filters)
    - Each action calls `assertProTier()` before mutations
    - _Requirements: 9.1, 9.2, 9.5_

  - [ ] 14.2 Create SaleForm component in `src/components/business/SaleForm.tsx`
    - Form fields: sale_date (required), product_id (dropdown), customer_id (dropdown), quantity_sold, sale_price (required)
    - Reusable for create and edit
    - Uses Zod validation with inline field errors
    - _Requirements: 9.1, 9.5_

  - [ ] 14.3 Create sales list page at `src/app/(dashboard)/business/sales/page.tsx`
    - Display all sales with date, product, customer, quantity, price
    - Show running total of revenue
    - Distinguish income records from expense records
    - _Requirements: 9.2, 9.3, 9.4_

  - [ ] 14.4 Create new sale page at `src/app/(dashboard)/business/sales/new/page.tsx`
    - Render SaleForm for creation
    - _Requirements: 9.1_

- [ ] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Business dashboard
  - [ ] 16.1 Create dashboard server actions in `src/lib/actions/dashboard.ts`
    - Implement `getDashboardMetrics(dateRange?)` that calls RPC functions
    - Return total_expenses, total_revenue, profit_or_loss, expenses_by_category, total_stock_value, top_products
    - Calls `assertProTier()` before fetching
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ] 16.2 Create DashboardSummary component in `src/components/business/DashboardSummary.tsx`
    - Display cards: Total Expenses, Total Revenue, Profit/Loss, Stock Value
    - Colour-code profit (green) vs loss (red)
    - _Requirements: 8.1, 8.2, 8.3, 8.6_

  - [ ] 16.3 Create ExpenseCategoryChart component in `src/components/business/ExpenseCategoryChart.tsx`
    - Display bar or pie chart of expenses grouped by category
    - _Requirements: 8.4_

  - [ ] 16.4 Create business dashboard page at `src/app/(dashboard)/business/page.tsx`
    - Render DashboardSummary, ExpenseCategoryChart, top products list
    - Include date range filter controls
    - Show empty states when no data exists
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.7, 8.8_

  - [ ]* 16.5 Write property tests for dashboard aggregation
    - **Property 5: Dashboard total expenses equals sum of costs** — verify sum calculation with and without date range
    - **Property 6: Dashboard total revenue equals sum of sales** — verify sum calculation with and without date range
    - **Property 7: Dashboard profit equals revenue minus expenses** — verify profit_or_loss = revenue - expenses
    - **Property 8: Dashboard category breakdown sums to total** — verify category group totals sum to overall total
    - **Property 9: Product ranking by revenue** — verify descending order by total revenue
    - **Property 10: Stock value aggregation** — verify sum of (available_stock × cost_per_unit)
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7**

  - [ ]* 16.6 Write property test for dashboard date range filtering
    - **Property 18: Dashboard date range filtering** — verify only records within inclusive date range contribute to metrics
    - **Validates: Requirements 8.7**

- [ ] 17. "What can I make?" stock sufficiency feature
  - [ ] 17.1 Create stock sufficiency check logic
    - For each product with a BOM, compare each line item's quantity_required against the material's available stock (quantity_owned - quantity_used)
    - Determine if all materials are sufficient to produce at least 1 unit
    - Calculate maximum producible quantity per product
    - _Requirements: 4.5, 4.6, 5.1, 5.2_

  - [ ] 17.2 Add "What can I make?" section to products page or dashboard
    - Display each product with BOM and its stock sufficiency status (can make / insufficient)
    - Show which materials are short and by how much
    - _Requirements: 4.5, 4.6, 5.1_

- [ ] 18. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation between major phases
- Property tests validate universal correctness properties from the design document
- All server actions follow the existing pattern: Zod validation → auth check → tier check → Supabase mutation → revalidatePath
- The implementation uses TypeScript throughout, consistent with the existing codebase
