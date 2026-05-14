# Wired for Crochet — Business, Tax & Universal Credit Features

Complete reference for all business, bookkeeping, tax return, and Universal Credit features.

---

## Table of Contents

1. [Business Suite Overview](#business-suite-overview)
2. [Invoicing System](#invoicing-system)
3. [Expense Tracking](#expense-tracking)
4. [Customers](#customers)
5. [Suppliers](#suppliers)
6. [Products & Bill of Materials](#products--bill-of-materials)
7. [Materials Inventory](#materials-inventory)
8. [Sales Tracking](#sales-tracking)
9. [Business Dashboard](#business-dashboard)
10. [SA103 Tax Return Helper](#sa103-tax-return-helper)
11. [Universal Credit Reporting](#universal-credit-reporting)
12. [AI Expense Categorisation](#ai-expense-categorisation)
13. [Evidence & Receipt Management](#evidence--receipt-management)
14. [Tier Structure](#tier-structure)

---

## Business Suite Overview

**Location:** `/business`  
**Tier:** Pro (and above)

The Business Suite provides full small-business management for self-employed crocheters. It covers everything from tracking expenses and managing customers to generating invoices and preparing tax returns.

### Key Pages

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/business` | Overview with revenue, expenses, profit, charts |
| Expenses | `/business/expenses` | Track all business purchases |
| Materials | `/business/materials` | Inventory of raw materials |
| Products | `/business/products` | Finished products with BOM |
| Customers | `/business/customers` | Customer database |
| Suppliers | `/business/suppliers` | Supplier database |
| Sales | `/business/sales` | Direct sales tracking |
| Invoicing | `/business/invoicing` | Invoices, quotes, payments |
| Tax Return | `/business/tax-return` | SA103 Self Assessment helper |
| UC Reporting | `/business/universal-credit` | Universal Credit monthly reporting |

---

## Invoicing System

**Location:** `/business/invoicing`  
**Tier:** Pro+

### Features

- **Invoices** — Create, edit, send, and track invoices
  - Auto-generated invoice numbers
  - Line items with quantity and unit price
  - Stage payments (deposit / stage 2 / final)
  - Status tracking: Draft → Unpaid → Partially Paid → Paid → Overdue
  - PDF generation and download
  - Email sending to customers (via Resend API)
  - Overdue detection

- **Quotes** — Create quotes and convert to invoices
  - Quote → Invoice conversion with one click
  - Status: Draft → Sent → Accepted → Rejected → Expired

- **Payments** — Record payments against invoices
  - Partial payments supported
  - Payment methods tracked
  - Payment history per invoice

- **Create Invoice from Project** — Auto-populates line items from:
  - Time tracked × hourly rate (labour)
  - Yarn/material costs used
  - Pricing extras added to the project
  - Auto-creates customer record if needed

### Key Files

```
src/app/(dashboard)/business/invoicing/
├── page.tsx                    # Invoicing dashboard
├── layout.tsx                  # Tab navigation
├── invoices/
│   ├── page.tsx               # Invoice list
│   ├── new/page.tsx           # Create invoice
│   └── [id]/
│       ├── page.tsx           # Invoice detail
│       └── edit/page.tsx      # Edit invoice
├── quotes/
│   ├── page.tsx               # Quote list
│   ├── new/page.tsx           # Create quote
│   └── [id]/
│       ├── page.tsx           # Quote detail
│       └── edit/page.tsx      # Edit quote
└── settings/page.tsx          # Business profile

src/lib/actions/
├── invoices.ts                # Invoice CRUD
├── quotes.ts                  # Quote CRUD
├── payments.ts                # Payment recording
├── business-profile.ts        # Business details
├── email-sender.ts            # Send invoices/quotes via email
└── project-to-invoice.ts     # Create invoice from project data

src/lib/pdf/
├── invoice-document.tsx       # Invoice PDF template
├── quote-document.tsx         # Quote PDF template
└── receipt-document.tsx       # Receipt PDF template
```

---

## Expense Tracking

**Location:** `/business/expenses`  
**Tier:** Pro

### Features

- Add expenses with date, description, amount, category, supplier
- **AI-powered category suggestion** — suggests category as you type description
- **Receipt photo capture** — "Take Photo" button opens mobile camera
- **File upload** — attach PDF/image receipts to expenses
- Filter by category, supplier, date range
- Categories aligned with SA103 tax return boxes

### Expense Categories (SA103-aligned)

| Category | SA103 Box | Examples |
|----------|-----------|---------|
| Cost of Goods | Box 11 | Yarn, materials, supplies for products |
| Car, Van & Travel | Box 12 | Mileage to craft fairs, postage runs |
| Wages & Staff Costs | Box 13 | Paying helpers |
| Rent, Rates & Power | Box 14 | Studio rent, proportion of home bills |
| Repairs & Maintenance | Box 15 | Sewing machine servicing |
| Professional Fees | Box 16 | Accountant, legal advice |
| Interest & Bank Charges | Box 17 | Business bank fees, PayPal fees |
| Phone, Stationery & Office | Box 18 | Phone bill, labels, packaging, subscriptions |
| Other Expenses | Box 19 | Equipment, books, training, craft fair fees |

### Quick Categories (legacy, auto-mapped)

- Stock/Materials → Box 11
- Equipment/Tools → Box 19
- Subscriptions → Box 18
- Books/Training → Box 19
- Office Supplies → Box 18

### Key Files

```
src/components/business/ExpenseForm.tsx      # Expense form with AI suggestion
src/components/business/InvoiceUploader.tsx  # Receipt upload with camera capture
src/lib/actions/expenses.ts                 # Expense CRUD
src/lib/actions/ai-categorise.ts            # AI category suggestion engine
src/lib/validators/expense.ts               # Zod validation
```

---

## Customers

**Location:** `/business/customers`  
**Tier:** Pro

### Features

- Customer database with name, email, phone, address, notes
- Link customers to projects and invoices
- **Customer selector on project form** — search existing or add new
- Customer detail page showing linked projects
- Auto-created when creating invoice from project (if customer name matches)

### Key Files

```
src/app/(dashboard)/business/customers/
src/lib/actions/customers.ts
src/components/projects/CustomerSelector.tsx
```

---

## Suppliers

**Location:** `/business/suppliers`  
**Tier:** Pro

### Features

- Supplier database with name, email, phone, website, notes
- Link suppliers to expenses
- Supplier detail page showing purchase history

---

## Products & Bill of Materials

**Location:** `/business/products`  
**Tier:** Pro

### Features

- Product catalogue with name, description, price, status
- **Bill of Materials (BOM)** — define materials needed per product
- BOM cost calculation
- Link products to materials inventory

---

## Materials Inventory

**Location:** `/business/materials`  
**Tier:** Pro

### Features

- Track raw materials with quantity, unit, cost
- Secondary unit support (e.g. yards AND balls)
- Link to suppliers
- Used in BOM calculations

---

## Sales Tracking

**Location:** `/business/sales`  
**Tier:** Pro

### Features

- Record direct sales (craft fairs, markets, online)
- Date, description, amount, customer
- Feeds into tax return income calculations

---

## Business Dashboard

**Location:** `/business`  
**Tier:** Pro

### Features

- Revenue summary (total invoiced, total paid)
- Expense summary by category
- Profit/loss calculation
- Date range filtering
- Quick links to Tax Return and UC Reporting
- "What Can I Make" — shows products you have materials for

---

## SA103 Tax Return Helper

**Location:** `/business/tax-return`  
**Tier:** Pro

### What It Does

Generates a complete SA103 (Self-Employment) summary mapped to HMRC box numbers. Pulls data from your invoices and expenses for the selected tax year (6 April – 5 April).

### Features

- **Tax year selector** — 2023/24, 2024/25, 2025/26, 2026/27
- **Auto-calculated boxes:**
  - Box 9: Turnover (paid invoices + direct sales)
  - Box 10: Other income
  - Boxes 11-19: Expenses by SA103 category
  - Box 20: Total expenses
  - Box 21: Net profit/loss
- **Manual entry boxes** (22-36) shown for reference with descriptions
- **Expense breakdown** — expandable detail showing every expense with date, description, amount
- **Clickable evidence** — 📎 links to view attached receipts
- **PDF export** — "Download SA103 PDF" generates a printable A4 document
- **Turnover breakdown** — shows each invoice contributing to income
- **Notes/warnings** — flags unpaid invoices, missing business profile, etc.

### How To Use

1. Go to Business → Tax Return
2. Select your tax year
3. Click "Generate SA103 Summary"
4. Review each box number and its calculated figure
5. Download the PDF for reference
6. Enter the figures into your HMRC Self Assessment online

### Important Notes

- This is a **preparation tool**, not a submission tool
- Always verify figures before entering on HMRC
- Does not submit to HMRC (would require MTD vendor registration)
- Household costs (use of home) not tracked — add manually if applicable
- Capital allowances (Box 23-25) require manual calculation

### Key Files

```
src/app/(dashboard)/business/tax-return/page.tsx   # Tax return UI
src/app/api/tax-report/[year]/route.ts             # PDF generation
src/lib/actions/tax-summary.ts                     # Calculation engine
```

---

## Universal Credit Reporting

**Location:** `/business/universal-credit`  
**Tier:** Pro

### What It Does

Helps self-employed UC claimants prepare accurate monthly income and expense figures for their UC reporting period. Organises evidence and flags missing documentation.

### Key Difference from Tax Return

- **Tax Return** = annual, based on invoiced income, April-April
- **UC Reporting** = monthly, based on money **actually received**, any date range

### Features

#### Reporting Periods
- Create periods manually or auto-generate 3 months
- Status workflow: Draft → Ready to Review → Submitted → Locked
- Lock periods after submission to prevent accidental edits
- Submission due date tracking

#### Income Tracking
- Add income manually (amount, date received, source, payment method)
- **Import from invoices** — pulls paid invoice payments for the period
- Distinguishes invoiced-but-unpaid vs actually-received
- Links back to original invoice for evidence

#### Expense Tracking
- Add expenses with UC-specific categories
- **Import from business expenses** — pulls and maps existing expenses
- **AI category suggestion** — suggests category as you type
- Links back to original expense record

#### UC Expense Categories

| Category | What it covers |
|----------|---------------|
| Materials | Yarn, supplies, raw materials |
| Mileage/Travel | Fuel, parking, public transport |
| Equipment | Tools, machines, tech |
| Insurance | Public liability, product insurance |
| Office Costs | Rent, rates, utilities |
| Phone/Internet | Mobile, broadband, software subscriptions |
| Advertising | Ads, flyers, social media promotion |
| Professional Fees | Accountant, legal |
| Other Allowable | Packaging, postage, craft fair fees, training |

#### Evidence Checker
- Flags entries without receipts or linked invoices
- Shows evidence completion percentage
- Warns about duplicate expenses
- Warns about unusually high amounts
- Checklist before marking period as ready

#### Monthly Summary Dashboard
- Total income received
- Total allowable expenses
- Estimated profit
- Evidence completion %
- Warnings and missing evidence list

#### PDF Report Export
- "Download PDF Report" generates a clean A4 summary
- Includes: period dates, income list, expense list, totals
- Designed to reference while completing UC reporting online

#### Reminder Notifications
- 🚨 Critical — Report overdue
- ⚠️ High — Due in 3 days or less / Period ended but not started
- 📋 Medium — Due in 7 days
- Dismissable alerts shown at top of UC page

#### Audit Trail
- Every create, edit, status change, and import is logged
- Timestamps and action details stored
- Cannot be edited or deleted

### How To Use

1. Go to Business → UC Reporting
2. Click "Auto-generate 3 months" to create periods
3. Select a period to work on
4. Click "Import Payments from Invoices" to pull income
5. Click "Import from Business Expenses" to pull expenses
6. Add any manual entries (cash payments, etc.)
7. Check the evidence completion and fix any gaps
8. Click "Mark Ready to Review" when satisfied
9. Download the PDF report for reference
10. Complete your UC reporting online using the figures
11. Click "Mark as Submitted" then "Lock Period"

### Key Files

```
src/app/(dashboard)/business/universal-credit/page.tsx  # UC dashboard
src/app/api/uc-report/[periodId]/route.ts               # PDF generation
src/lib/actions/universal-credit.ts                     # All UC actions
src/components/business/UCReminders.tsx                  # Reminder alerts
src/types/universal-credit.ts                           # Types
supabase/migrations/20241001000001_universal_credit.sql  # Database schema
```

### Database Tables

| Table | Purpose |
|-------|---------|
| `uc_reporting_periods` | Monthly periods with status and dates |
| `uc_income_entries` | Income received during each period |
| `uc_expense_entries` | Expenses incurred during each period |
| `uc_evidence_files` | Uploaded evidence linked to entries |
| `uc_audit_log` | Audit trail of all actions |

---

## AI Expense Categorisation

**Location:** Used in both Business Expenses form and UC Expense form  
**Tier:** All (no external API needed)

### How It Works

As you type an expense description, the system suggests a category using keyword matching against 100+ craft-business-specific terms.

### Example Suggestions

| You type... | Suggested category | Confidence |
|-------------|-------------------|------------|
| "Yarn from Hobbycraft" | Materials | High |
| "Etsy monthly subscription" | Phone/Internet | High |
| "Petrol to craft fair" | Mileage/Travel | High |
| "Business cards printed" | Advertising | Medium |
| "Accountant annual fee" | Professional Fees | High |
| "Safety eyes for amigurumi" | Materials | High |
| "Royal Mail postage" | Other Allowable | High |
| "Table hire at market" | Other Allowable | Medium |

### Confidence Levels

- **High** — Multiple keyword matches, auto-selects category
- **Medium** — Single keyword match, shows suggestion with "Use this" button
- **Low** — No match, defaults to "Other Allowable"

### Key File

```
src/lib/actions/ai-categorise.ts
```

---

## Evidence & Receipt Management

### Where Evidence Is Stored

- **Business Expenses** — `invoice_path` and `invoice_file_name` on the `purchases` table
- **UC Entries** — `uc_evidence_files` table with links to income/expense entries
- **Storage Bucket** — `invoices` bucket in Supabase Storage

### How To Attach Evidence

1. **On expense form** — "Take Photo" (mobile camera) or "Choose File" (PDF/image)
2. **On UC entries** — Upload evidence files linked to specific entries

### Viewing Evidence

- **Tax Return page** — 📎 icon next to each expense links to the expenses page
- **UC page** — Missing evidence checker shows which entries need receipts
- **Expenses list** — Shows attached filename for each expense

### Supported File Types

- PDF (invoices, statements)
- JPEG/PNG/WebP (photos of receipts)
- Max 10 MB per file

---

## Tier Structure

| Tier | Monthly Cost | Features |
|------|-------------|----------|
| **Free** | £0 | Project tracking, timer, counters, yarn/hook inventory, patterns, photos, notes, pricing calculator |
| **Pro** | TBD | + Business suite: expenses, materials, products, BOM, customers, suppliers, sales, dashboard, tax return, UC reporting |
| **Pro+** | TBD | + Invoicing: invoices, quotes, payments, PDF generation, email sending, business profile |

---

## Migrations Required

Run these in your Supabase SQL Editor to activate all business features:

```sql
-- Core business tables
supabase/migrations/20240301000001_business_suite.sql

-- Invoicing system
supabase/migrations/20240501000001_invoicing_system.sql

-- Universal Credit
supabase/migrations/20241001000001_universal_credit.sql
```

---

## Environment Variables

```
# Required for email sending
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=Wired for Crochet <noreply@wiredforcrochet.com>
```

Set these in Supabase Dashboard → Edge Functions → Secrets.

---

## Future Enhancements

- [ ] Direct HMRC MTD API submission (requires vendor registration)
- [ ] Direct UC API submission (requires DWP approval)
- [ ] Bank feed integration (Open Banking)
- [ ] Receipt OCR scanning (extract amount/date from photos)
- [ ] Automated evidence matching
- [ ] Accountant access portal (read-only view)
- [ ] Stripe Connect for marketplace paid sales
- [ ] VAT tracking and MTD for VAT
- [ ] Multi-currency support for international sales
