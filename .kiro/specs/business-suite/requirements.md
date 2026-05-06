# Requirements Document: Business Suite

## Introduction

The Business Suite is a premium module for the "Wired for Crochet" app that transforms the existing project tracker into a full business management tool. It adds expense tracking, product catalog management, enhanced materials inventory, bill of materials costing, customer and supplier databases, business reporting, and subscription-tier gating. The module is designed to be toggled on/off based on the user's subscription tier (free vs. pro), with all business features gated behind the pro tier while the existing project tracking features remain available to all users.

## Glossary

- **Business_Suite**: The collection of premium features including expense tracking, product catalog, enhanced inventory, bill of materials, customer database, supplier management, and business reporting
- **Tier_Gate**: The access control mechanism that checks a user's subscription tier before rendering business suite features
- **Expense_Tracker**: The module for recording purchases, categorising costs, and tracking money in/out
- **Product_Catalog**: The module for defining finished products the user sells, including pricing and status
- **Materials_Inventory**: The enhanced inventory system covering yarn and non-yarn materials with cost-per-unit calculations
- **Bill_of_Materials**: The cost calculator that defines a product's material recipe and computes total production cost
- **Customer_Database**: The module for storing customer contact information and linking customers to orders/projects
- **Supplier_Manager**: The module for storing supplier information and linking suppliers to purchases
- **Business_Dashboard**: The reporting interface showing financial summaries, charts, and key metrics
- **Purchase_Record**: A single expense entry with date, description, category, cost, supplier, and optional invoice
- **Product_Entry**: A single product definition with name, description, sell price, photo, and active status
- **Material_Entry**: A single inventory item (yarn or non-yarn) with type, quantity, cost, and cost-per-unit
- **BOM_Line_Item**: A single line in a bill of materials specifying a material and the quantity required
- **Customer_Record**: A single customer entry with contact details and linked order history
- **Supplier_Record**: A single supplier entry with contact details and linked purchase history
- **Subscription_Tier**: The user's current plan level, either "free" or "pro"

## Requirements

### Requirement 1: Subscription Tier Gating

**User Story:** As a product owner, I want to gate business features behind a pro subscription tier, so that the app can be monetised with a freemium model.

#### Acceptance Criteria

1. THE Tier_Gate SHALL store a subscription_tier field on the user_settings record with allowed values "free" and "pro"
2. WHEN a user with subscription_tier "free" navigates to a Business_Suite page, THE Tier_Gate SHALL display an upgrade prompt instead of the page content
3. WHEN a user with subscription_tier "pro" navigates to a Business_Suite page, THE Tier_Gate SHALL render the full page content
4. THE Tier_Gate SHALL default new users to subscription_tier "free"
5. WHEN the subscription_tier value is changed from "free" to "pro", THE Tier_Gate SHALL immediately grant access to all Business_Suite features without requiring a page reload
6. WHEN the subscription_tier value is changed from "pro" to "free", THE Tier_Gate SHALL immediately revoke access to all Business_Suite features and display upgrade prompts
7. THE Tier_Gate SHALL enforce access control at both the UI rendering layer and the server action layer to prevent direct API access to gated features

### Requirement 2: Expense and Purchase Tracking

**User Story:** As a crochet business owner, I want to record all my business purchases and expenses, so that I can track my spending and calculate profit.

#### Acceptance Criteria

1. WHEN a user creates a Purchase_Record, THE Expense_Tracker SHALL store the date, description, category, cost, supplier, and optional invoice reference
2. THE Expense_Tracker SHALL support the following expense categories: equipment, stock, subscription, books, office_supplies
3. WHEN a user uploads an invoice file (PDF or image), THE Expense_Tracker SHALL store the file and link it to the Purchase_Record
4. THE Expense_Tracker SHALL allow users to define and manage a list of suppliers (name and optional details)
5. THE Expense_Tracker SHALL display a running total of money out (sum of all expenses)
6. WHEN a user filters Purchase_Records by category, THE Expense_Tracker SHALL display only records matching the selected category
7. WHEN a user filters Purchase_Records by supplier, THE Expense_Tracker SHALL display only records matching the selected supplier
8. WHEN a user filters Purchase_Records by date range, THE Expense_Tracker SHALL display only records with dates within the specified range
9. IF a user attempts to create a Purchase_Record without a date or cost, THEN THE Expense_Tracker SHALL reject the submission and display a validation error
10. THE Expense_Tracker SHALL allow users to edit and delete existing Purchase_Records

### Requirement 3: Product Catalog

**User Story:** As a crochet business owner, I want to maintain a catalog of products I sell, so that I can manage my product offerings and track which items are active.

#### Acceptance Criteria

1. WHEN a user creates a Product_Entry, THE Product_Catalog SHALL store the name, description, sell price, and optional photo
2. THE Product_Catalog SHALL track each Product_Entry as either "active" or "discontinued"
3. WHEN a user marks a Product_Entry as discontinued, THE Product_Catalog SHALL retain the product record but exclude it from active product listings by default
4. THE Product_Catalog SHALL allow linking a Product_Entry to one or more projects that produce that product
5. WHEN a user views a Product_Entry, THE Product_Catalog SHALL display all linked projects
6. THE Product_Catalog SHALL allow users to edit and delete existing Product_Entries
7. IF a user attempts to create a Product_Entry without a name or sell price, THEN THE Product_Catalog SHALL reject the submission and display a validation error

### Requirement 4: Enhanced Materials Inventory

**User Story:** As a crochet business owner, I want to track all my materials (not just yarn), so that I can monitor stock levels and understand my material costs.

#### Acceptance Criteria

1. WHEN a user creates a Material_Entry, THE Materials_Inventory SHALL store the item name, type, category, colour, quantity, total cost, and unit of measurement
2. THE Materials_Inventory SHALL support the following material categories: yarn, accessories, hardware, tools
3. THE Materials_Inventory SHALL auto-calculate cost_per_unit by dividing total_cost by quantity when both values are provided
4. WHEN a user updates the total_cost or quantity of a Material_Entry, THE Materials_Inventory SHALL recalculate the cost_per_unit
5. THE Materials_Inventory SHALL track quantity_owned and quantity_used for each Material_Entry
6. WHEN quantity_used increases for a Material_Entry, THE Materials_Inventory SHALL compute available stock as quantity_owned minus quantity_used
7. THE Materials_Inventory SHALL support unit types including grams, metres, pieces, and skeins
8. THE Materials_Inventory SHALL allow users to edit and delete existing Material_Entries
9. IF a user attempts to create a Material_Entry without a name or category, THEN THE Materials_Inventory SHALL reject the submission and display a validation error
10. THE Materials_Inventory SHALL integrate with the existing yarn_entries table, treating yarn entries as Material_Entries with category "yarn"

### Requirement 5: Bill of Materials and Cost Calculator

**User Story:** As a crochet business owner, I want to define the materials and time needed to make each product, so that I can accurately calculate production costs and set profitable prices.

#### Acceptance Criteria

1. WHEN a user defines a bill of materials for a Product_Entry, THE Bill_of_Materials SHALL allow adding multiple BOM_Line_Items, each specifying a Material_Entry and the quantity required
2. THE Bill_of_Materials SHALL calculate material_cost as the sum of (quantity_required × cost_per_unit) for all BOM_Line_Items
3. WHEN a user specifies time_taken_minutes and wages_per_minute for a Product_Entry, THE Bill_of_Materials SHALL calculate labour_cost as time_taken_minutes multiplied by wages_per_minute
4. THE Bill_of_Materials SHALL allow adding extra costs (safety eyes, keychains, stuffing, packaging) as named line items with fixed amounts
5. THE Bill_of_Materials SHALL calculate total_production_cost as material_cost plus labour_cost plus the sum of all extra costs
6. THE Bill_of_Materials SHALL calculate a suggested_sell_price based on total_production_cost plus a user-defined profit margin (percentage or fixed amount)
7. WHEN a Material_Entry's cost_per_unit changes, THE Bill_of_Materials SHALL reflect the updated cost in all Product_Entries that reference that material
8. IF a BOM_Line_Item references a Material_Entry that has been deleted, THEN THE Bill_of_Materials SHALL flag the line item as invalid and exclude it from cost calculations until resolved
9. THE Bill_of_Materials SHALL display a breakdown showing material_cost, labour_cost, extras_total, total_production_cost, and suggested_sell_price

### Requirement 6: Customer Database

**User Story:** As a crochet business owner, I want to store customer information, so that I can manage relationships and track order history.

#### Acceptance Criteria

1. WHEN a user creates a Customer_Record, THE Customer_Database SHALL store the name, email, phone, address, and notes
2. THE Customer_Database SHALL allow linking a Customer_Record to one or more projects
3. WHEN a user views a Customer_Record, THE Customer_Database SHALL display all linked projects as order history
4. THE Customer_Database SHALL allow searching customers by name or email
5. THE Customer_Database SHALL allow users to edit and delete existing Customer_Records
6. IF a user attempts to create a Customer_Record without a name, THEN THE Customer_Database SHALL reject the submission and display a validation error
7. WHEN a Customer_Record is deleted, THE Customer_Database SHALL unlink the customer from associated projects without deleting the projects

### Requirement 7: Supplier Management

**User Story:** As a crochet business owner, I want to manage my supplier information, so that I can track where I buy materials and view purchase history per supplier.

#### Acceptance Criteria

1. WHEN a user creates a Supplier_Record, THE Supplier_Manager SHALL store the name, website, and notes
2. THE Supplier_Manager SHALL allow linking a Supplier_Record to Purchase_Records
3. WHEN a user views a Supplier_Record, THE Supplier_Manager SHALL display all linked Purchase_Records as purchase history
4. THE Supplier_Manager SHALL allow searching suppliers by name
5. THE Supplier_Manager SHALL allow users to edit and delete existing Supplier_Records
6. IF a user attempts to create a Supplier_Record without a name, THEN THE Supplier_Manager SHALL reject the submission and display a validation error
7. WHEN a Supplier_Record is deleted, THE Supplier_Manager SHALL unlink the supplier from associated Purchase_Records without deleting the purchases

### Requirement 8: Business Dashboard and Reporting

**User Story:** As a crochet business owner, I want to see a summary of my business finances, so that I can understand my profitability and make informed decisions.

#### Acceptance Criteria

1. THE Business_Dashboard SHALL display total expenses (sum of all Purchase_Record costs)
2. THE Business_Dashboard SHALL display total revenue (sum of sell_price for all completed projects linked to Product_Entries)
3. THE Business_Dashboard SHALL display profit_or_loss calculated as total_revenue minus total_expenses
4. THE Business_Dashboard SHALL display a breakdown of expenses grouped by category
5. THE Business_Dashboard SHALL display a list of top products ranked by revenue
6. THE Business_Dashboard SHALL display total stock value calculated as the sum of (quantity_owned × cost_per_unit) for all Material_Entries
7. WHEN a user selects a date range filter, THE Business_Dashboard SHALL recalculate all displayed metrics using only data within the specified range
8. THE Business_Dashboard SHALL update displayed values when underlying Purchase_Records, Product_Entries, or project completions change

### Requirement 9: Revenue Tracking via Sales Records

**User Story:** As a crochet business owner, I want to record sales of my products, so that I can track income and calculate profit accurately.

#### Acceptance Criteria

1. WHEN a user records a sale, THE Expense_Tracker SHALL store the date, Product_Entry reference, quantity sold, sale price, and optional Customer_Record reference
2. THE Expense_Tracker SHALL display a running total of money in (sum of all sale amounts)
3. THE Expense_Tracker SHALL calculate profit as total money in minus total money out
4. WHEN a user views the expense list, THE Expense_Tracker SHALL distinguish between income records and expense records
5. IF a user attempts to record a sale without a date or sale price, THEN THE Expense_Tracker SHALL reject the submission and display a validation error

### Requirement 10: Invoice and Receipt Storage

**User Story:** As a crochet business owner, I want to upload and store invoices and receipts, so that I have a digital record for accounting purposes.

#### Acceptance Criteria

1. WHEN a user uploads an invoice file, THE Expense_Tracker SHALL accept PDF, JPEG, and PNG file formats
2. THE Expense_Tracker SHALL enforce a maximum file size of 10 MB per invoice upload
3. WHEN a user views a Purchase_Record with an attached invoice, THE Expense_Tracker SHALL provide a link to view or download the stored file
4. IF a user uploads a file with an unsupported format, THEN THE Expense_Tracker SHALL reject the upload and display a validation error specifying the allowed formats
5. THE Expense_Tracker SHALL store invoice files in a private storage bucket accessible only to the owning user
