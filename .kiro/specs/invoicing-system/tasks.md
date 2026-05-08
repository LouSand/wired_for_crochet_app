# Implementation Plan: Invoicing System

## Overview

This plan implements the Invoicing System as a premium module gated behind the `pro_plus` subscription tier. It ports the RedKiteApp Flask invoicing functionality into the existing Next.js/Supabase/TypeScript architecture. Implementation follows existing patterns: server actions with Zod validation, Supabase RLS, `@react-pdf/renderer` for PDF generation, and Next.js App Router conventions. Tasks are organized into logical phases with checkpoints between major milestones.

## Tasks

- [x] 1. Database migration and storage setup
  - [x] 1.1 Create SQL migration file `supabase/migrations/20240501000001_invoicing_system.sql`
    - Alter `user_settings` to drop and re-add `subscription_tier` CHECK constraint to include `'pro_plus'`
    - Add `business_profile` JSONB column (DEFAULT NULL) to `user_settings`
    - Create `invoices` table with id, user_id, customer_id (FK RESTRICT), project_id (FK SET NULL), invoice_number, issue_date, due_date, total, amount_paid, status (CHECK enum), deposit_percent, stage2_percent, final_percent, quote_id, timestamps, UNIQUE(user_id, invoice_number), CHECK percentages sum to 100
    - Create `invoice_items` table with id, invoice_id (FK CASCADE), user_id, description, quantity (CHECK > 0), unit_price (CHECK > 0), line_total (GENERATED STORED as quantity * unit_price), sort_order, created_at
    - Create `quotes` table with id, user_id, customer_id (FK RESTRICT), quote_number, issue_date, total, status (CHECK enum), timestamps, UNIQUE(user_id, quote_number)
    - Create `quote_items` table with id, quote_id (FK CASCADE), user_id, description, quantity (CHECK > 0), unit_price (CHECK > 0), line_total (GENERATED STORED), sort_order, created_at
    - Create `payments` table with id, invoice_id (FK CASCADE), user_id, amount (CHECK > 0), payment_date, created_at
    - Create `email_logs` table with id, user_id, document_type (CHECK enum), document_id, recipient, subject, sent_at, send_count
    - Enable RLS on all new tables with user_id = auth.uid() policies (SELECT, INSERT, UPDATE, DELETE)
    - Create indexes on user_id, customer_id, status, due_date, invoice_id, quote_id, document_type+document_id
    - _Requirements: 1.1, 1.2, 1.5, 2.1, 3.1, 4.1, 4.5, 7.3, 8.4, 9.1_

  - [x] 1.2 Create Supabase Storage bucket for business assets
    - Insert `business-assets` bucket (public, 5 MB limit, allowed MIME types: image/jpeg, image/png)
    - Add RLS policy so users can only manage files in their own user_id folder
    - _Requirements: 8.2_

- [x] 2. TypeScript types and Zod validators
  - [x] 2.1 Create invoicing TypeScript types in `src/types/invoicing.ts`
    - Define `INVOICE_STATUSES` const array and `InvoiceStatus` type
    - Define `QUOTE_STATUSES` const array and `QuoteStatus` type
    - Define `InvoiceRow`, `InvoiceItemRow`, `InvoiceWithDetails` interfaces
    - Define `QuoteRow`, `QuoteItemRow`, `QuoteWithDetails` interfaces
    - Define `PaymentRow`, `EmailLogRow`, `BusinessProfile` interfaces
    - Define `InvoiceFilters`, `QuoteFilters` interfaces
    - Define action state types: `InvoiceActionState`, `QuoteActionState`, `PaymentActionState`, `ProfileActionState`, `EmailActionState`
    - _Requirements: 1.5, 1.9, 4.5, 4.9, 8.1_

  - [x] 2.2 Update `src/types/business.ts` to add `pro_plus` to `SubscriptionTier` type
    - Add `'pro_plus'` to the SubscriptionTier union type
    - _Requirements: 9.1_

  - [x] 2.3 Create Zod validator for invoices in `src/lib/validators/invoice.ts`
    - Define `invoiceItemSchema` with description (min 1), quantity (positive int), unit_price (positive number)
    - Define `invoiceFormSchema` with customer_id (uuid), issue_date (date string), due_date (date string), items (min 1), deposit_percent (default 40), stage2_percent (default 40), final_percent (default 20), project_id (optional uuid)
    - Add `.refine()` to ensure stage percentages sum to 100
    - _Requirements: 1.11, 1.12, 1.13, 2.1, 2.4_

  - [x] 2.4 Create Zod validator for quotes in `src/lib/validators/quote.ts`
    - Define `quoteItemSchema` with description (min 1), quantity (positive int), unit_price (positive number)
    - Define `quoteFormSchema` with customer_id (uuid), issue_date (date string), items (min 1)
    - _Requirements: 4.10, 4.11, 4.12_

  - [x] 2.5 Create Zod validator for payments in `src/lib/validators/payment.ts`
    - Define `paymentFormSchema` with invoice_id (uuid), amount (positive number), payment_date (date string)
    - _Requirements: 3.7_

  - [x] 2.6 Create Zod validator for business profile in `src/lib/validators/business-profile.ts`
    - Define `businessProfileSchema` with company_name (min 1), address, phone, email (optional valid email or empty), bank_account_name, bank_account_number, bank_sort_code (regex `^\d{2}-\d{2}-\d{2}$` or empty), logo_url (optional url)
    - _Requirements: 8.1, 8.6_

  - [ ]* 2.7 Write property tests for invoice/quote validators
    - **Property 4: Schema validation rejects invalid inputs**
    - **Property 5: Stage percentages must sum to 100**
    - **Validates: Requirements 1.11, 1.12, 1.13, 2.4, 4.10, 4.11, 4.12**

  - [ ]* 2.8 Write property tests for business profile validator
    - **Property 18: Sort code format validation**
    - **Validates: Requirements 8.6**

- [x] 3. Checkpoint - Ensure migration and validators are correct
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Tier gating for pro_plus
  - [x] 4.1 Add `assertProPlusTier()` function to `src/lib/actions/business-gate.ts`
    - Check subscription_tier is `'pro_plus'`; return error object if not
    - Keep existing `assertProTier()` unchanged for business suite features
    - _Requirements: 9.3, 9.4_

  - [x] 4.2 Create invoicing layout with tier gate at `src/app/(dashboard)/business/invoicing/layout.tsx`
    - Call `getSubscriptionTier()` and render upgrade prompt if not `pro_plus`
    - Otherwise render children
    - _Requirements: 9.1, 9.2_

  - [ ]* 4.3 Write property test for tier gate enforcement
    - **Property 19: Tier gate enforcement**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

- [x] 5. Business profile management
  - [x] 5.1 Create server actions in `src/lib/actions/business-profile.ts`
    - Implement `getBusinessProfile()` — fetch business_profile JSON from user_settings
    - Implement `updateBusinessProfile(prevState, formData)` — validate with Zod, update user_settings.business_profile
    - Implement `uploadBusinessLogo(formData)` — upload to `business-assets/{user_id}/logo.{ext}`, return public URL
    - All actions call `assertProPlusTier()` first
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 5.2 Create business profile form component at `src/components/invoicing/business-profile-form.tsx`
    - Form fields for company name, address, phone, email, bank account name, bank account number, bank sort code
    - Logo upload with preview (JPEG/PNG, max 5 MB)
    - Use `useActionState` pattern consistent with existing forms
    - _Requirements: 8.1, 8.2, 8.6_

  - [x] 5.3 Create business profile settings page at `src/app/(dashboard)/business/invoicing/settings/page.tsx`
    - Fetch current profile, render `BusinessProfileForm`
    - _Requirements: 8.3_

  - [ ]* 5.4 Write property test for business profile round-trip
    - **Property 17: Business profile round-trip**
    - **Validates: Requirements 8.1, 8.3**

- [x] 6. Invoice CRUD (server actions + pages)
  - [x] 6.1 Create invoice server actions in `src/lib/actions/invoices.ts`
    - Implement `getNextInvoiceNumber()` — query max invoice_number for user, return next sequential `INV-XXX`
    - Implement `createInvoice(prevState, formData)` — validate with Zod, insert invoice + items, calculate total, set status "draft"
    - Implement `updateInvoice(id, prevState, formData)` — check status is draft/unpaid, validate, update invoice + items
    - Implement `deleteInvoice(id)` — check status is draft, delete
    - Implement `getInvoices(filters?)` — fetch list with customer name join, support status/customer/overdue filters
    - Implement `getInvoice(id)` — fetch with items, payments, customer, email_logs
    - All actions call `assertProPlusTier()` first
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.14, 2.2, 2.3_

  - [x] 6.2 Create customer select component at `src/components/invoicing/customer-select.tsx`
    - Searchable dropdown using existing customers table
    - Display customer name, show email/phone as secondary info
    - _Requirements: 10.1, 10.2_

  - [x] 6.3 Create invoice form component at `src/components/invoicing/invoice-form.tsx`
    - Customer select, issue date, due date, project select (optional)
    - Dynamic line items (add/remove rows) with description, quantity, unit price, calculated line total
    - Stage payment percentage inputs with validation (must sum to 100)
    - Auto-calculated invoice total
    - _Requirements: 1.1, 1.3, 1.4, 1.11, 1.12, 1.13, 2.1, 2.2_

  - [x] 6.4 Create invoice list component at `src/components/invoicing/invoice-list.tsx`
    - Display invoice number, client name, total, amount paid, remaining balance, status badge
    - Status filter tabs, overdue visual indicator
    - _Requirements: 1.9, 11.3, 11.4_

  - [x] 6.5 Create invoice detail component at `src/components/invoicing/invoice-detail.tsx`
    - Display all invoice details: header, line items, stage payment breakdown, payment history, balance
    - Action buttons: edit (if draft/unpaid), delete (if draft), download PDF, send email
    - _Requirements: 1.10, 2.5_

  - [x] 6.6 Create invoice pages
    - `src/app/(dashboard)/business/invoicing/invoices/page.tsx` — list page
    - `src/app/(dashboard)/business/invoicing/invoices/new/page.tsx` — create page
    - `src/app/(dashboard)/business/invoicing/invoices/[id]/page.tsx` — detail page
    - `src/app/(dashboard)/business/invoicing/invoices/[id]/edit/page.tsx` — edit page
    - _Requirements: 1.1, 1.7, 1.9, 1.10_

  - [ ]* 6.7 Write property tests for invoice numbering and totals
    - **Property 1: Line item total calculation**
    - **Property 2: Document total equals sum of line totals**
    - **Property 3: Sequential document numbering (INV-XXX)**
    - **Validates: Requirements 1.2, 1.3, 1.4**

  - [ ]* 6.8 Write property test for status-gated mutations
    - **Property 11: Status-gated mutations (invoice edit/delete rules)**
    - **Validates: Requirements 1.7, 1.8**

- [x] 7. Checkpoint - Ensure invoice CRUD works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Quote CRUD (server actions + pages)
  - [x] 8.1 Create quote server actions in `src/lib/actions/quotes.ts`
    - Implement `getNextQuoteNumber()` — query max quote_number for user, return next sequential `QTE-XXX`
    - Implement `createQuote(prevState, formData)` — validate with Zod, insert quote + items, calculate total, set status "draft"
    - Implement `updateQuote(id, prevState, formData)` — check status is draft, validate, update quote + items
    - Implement `deleteQuote(id)` — check status is draft, delete
    - Implement `getQuotes(filters?)` — fetch list with customer name join, support status/customer filters
    - Implement `getQuote(id)` — fetch with items, customer, email_logs
    - All actions call `assertProPlusTier()` first
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

  - [x] 8.2 Create quote form component at `src/components/invoicing/quote-form.tsx`
    - Customer select, issue date
    - Dynamic line items (add/remove rows) with description, quantity, unit price, calculated line total
    - Auto-calculated quote total
    - _Requirements: 4.1, 4.3, 4.4, 4.10, 4.11, 4.12_

  - [x] 8.3 Create quote list component at `src/components/invoicing/quote-list.tsx`
    - Display quote number, client name, total, status badge, issue date
    - Status filter tabs
    - _Requirements: 4.9_

  - [x] 8.4 Create quote detail component at `src/components/invoicing/quote-detail.tsx`
    - Display all quote details: header, line items, total
    - Action buttons: edit (if draft), delete (if draft), convert to invoice (if draft/sent), download PDF, send email
    - _Requirements: 4.7, 4.8, 5.4_

  - [x] 8.5 Create quote pages
    - `src/app/(dashboard)/business/invoicing/quotes/page.tsx` — list page
    - `src/app/(dashboard)/business/invoicing/quotes/new/page.tsx` — create page
    - `src/app/(dashboard)/business/invoicing/quotes/[id]/page.tsx` — detail page
    - `src/app/(dashboard)/business/invoicing/quotes/[id]/edit/page.tsx` — edit page
    - _Requirements: 4.1, 4.7, 4.9_

  - [ ]* 8.6 Write property tests for quote numbering and status gates
    - **Property 3: Sequential document numbering (QTE-XXX)**
    - **Property 11: Status-gated mutations (quote edit/delete/convert rules)**
    - **Validates: Requirements 4.2, 4.7, 4.8, 5.4**

- [x] 9. Payment recording
  - [x] 9.1 Create payment server actions in `src/lib/actions/payments.ts`
    - Implement `recordPayment(prevState, formData)` — validate with Zod, check amount_paid + new amount <= total, insert payment, update invoice amount_paid and status (partial/paid)
    - Implement `deletePayment(paymentId, invoiceId)` — delete payment, recalculate invoice amount_paid and status
    - Implement `getPaymentsForInvoice(invoiceId)` — fetch payments ordered by payment_date descending
    - All actions call `assertProPlusTier()` first
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [x] 9.2 Create payment form component at `src/components/invoicing/payment-form.tsx`
    - Amount input, payment date picker
    - Display current balance and max allowed payment
    - _Requirements: 3.1, 3.7, 3.8_

  - [x] 9.3 Create payment history component at `src/components/invoicing/payment-history.tsx`
    - List payments with date, amount, and delete button
    - Ordered by payment date descending
    - _Requirements: 3.6_

  - [x] 9.4 Create stage payment display component at `src/components/invoicing/stage-payment-display.tsx`
    - Show deposit, stage 2, final with percentage, amount, and covered/uncovered status
    - Stage is covered when cumulative payments meet or exceed cumulative stage thresholds
    - _Requirements: 2.5, 2.6, 2.7_

  - [ ]* 9.5 Write property tests for payment logic
    - **Property 6: Stage coverage determination**
    - **Property 7: Payment recording updates status correctly**
    - **Property 8: Payment deletion reverses amount_paid**
    - **Property 9: Payment history ordering**
    - **Property 10: Overpayment rejection**
    - **Validates: Requirements 2.6, 2.7, 3.2, 3.3, 3.4, 3.6, 3.8, 3.9**

- [x] 10. Checkpoint - Ensure payments and quotes work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Quote-to-invoice conversion
  - [x] 11.1 Implement `convertQuoteToInvoice(quoteId, dueDate)` in `src/lib/actions/quotes.ts`
    - Check quote status is draft or sent
    - Create new invoice with same customer, line items (descriptions, quantities, prices), and total
    - Set invoice issue_date to current date, due_date from parameter
    - Set invoice quote_id reference back to originating quote
    - Update quote status to "accepted"
    - Call `assertProPlusTier()` first
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 11.2 Add convert-to-invoice UI button in quote detail component
    - Show button only when quote status is draft or sent
    - Prompt user for due date before conversion
    - Redirect to new invoice detail page after conversion
    - _Requirements: 5.3, 5.4_

  - [ ]* 11.3 Write property test for quote-to-invoice data preservation
    - **Property 12: Quote-to-invoice data preservation**
    - **Validates: Requirements 5.1**

- [x] 12. PDF generation
  - [x] 12.1 Create invoice PDF template at `src/lib/pdf/invoice-document.tsx`
    - React PDF component using `@react-pdf/renderer`
    - Include: business header (logo, company name, address, phone, email), invoice number, client details, issue date, due date, line items table (description, qty, unit price, line total), invoice total, stage payment breakdown with coverage status, payment history, remaining balance, bank payment details
    - Format monetary values using user's configured currency via `formatCurrency`
    - _Requirements: 6.1, 6.4, 6.5, 6.6_

  - [x] 12.2 Create quote PDF template at `src/lib/pdf/quote-document.tsx`
    - React PDF component using `@react-pdf/renderer`
    - Include: business header (logo, company name, address, phone, email), quote number, client details, issue date, line items table, quote total
    - Format monetary values using user's configured currency
    - _Requirements: 6.2, 6.4, 6.5, 6.6_

  - [x] 12.3 Create payment receipt PDF template at `src/lib/pdf/receipt-document.tsx`
    - React PDF component using `@react-pdf/renderer`
    - Include: business header, invoice reference, payment date, payment amount, updated remaining balance
    - Format monetary values using user's configured currency
    - _Requirements: 6.3, 6.4, 6.6_

  - [x] 12.4 Create PDF download button component at `src/components/invoicing/pdf-download-button.tsx`
    - Use `@react-pdf/renderer` `pdf()` function to generate blob client-side
    - Trigger browser download with appropriate filename (e.g., `INV-001.pdf`)
    - Handle missing business profile gracefully (render without header, show setup prompt)
    - _Requirements: 6.7, 8.5_

  - [ ]* 12.5 Write property test for PDF content completeness
    - **Property 13: PDF contains all required sections**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.6**

- [x] 13. Email sending
  - [x] 13.1 Create email sender server action in `src/lib/actions/email-sender.ts`
    - Implement `sendInvoiceEmail(invoiceId)` — generate PDF, check customer has email, create/update email_log, update invoice status from draft→unpaid if applicable
    - Implement `sendQuoteEmail(quoteId)` — generate PDF, check customer has email, create/update email_log, update quote status from draft→sent if applicable
    - Call Supabase Edge Function with SendEmailRequest payload (base64-encoded PDF attachment)
    - Call `assertProPlusTier()` first
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

  - [x] 13.2 Create Supabase Edge Function stub at `supabase/functions/send-email/index.ts`
    - Accept SendEmailRequest (to, subject, body, attachments)
    - Stub implementation that logs the request and returns success (Resend integration deferred)
    - Include comments for future Resend API integration
    - _Requirements: 7.1, 7.2_

  - [x] 13.3 Create email send button component at `src/components/invoicing/email-send-button.tsx`
    - Show send/resend button with send count indicator
    - Display last sent timestamp and total send count from email_logs
    - Disable with message if customer has no email on file
    - _Requirements: 7.5, 7.6_

  - [ ]* 13.4 Write property tests for email logic
    - **Property 14: Email send count increment**
    - **Property 15: Email requires client email**
    - **Property 16: Draft status transitions on email send**
    - **Validates: Requirements 7.4, 7.6, 7.7, 7.8**

- [x] 14. Checkpoint - Ensure PDF generation and email sending work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Status automation (overdue detection)
  - [x] 15.1 Implement overdue detection logic in `src/lib/actions/invoices.ts`
    - Add `checkOverdueInvoices()` function — query invoices where due_date < today AND status IN ('unpaid', 'partial'), update status to 'overdue'
    - Call this check when loading invoice list (or as a utility called from the list page server component)
    - _Requirements: 11.1_

  - [x] 15.2 Add overdue visual indicator to invoice list component
    - Style overdue status badge distinctly (e.g., red/warning color)
    - Add "Overdue" filter tab to invoice list
    - _Requirements: 11.3, 11.4_

  - [ ]* 15.3 Write property test for overdue status detection
    - **Property 20: Overdue status detection**
    - **Validates: Requirements 11.1**

- [x] 16. Integration (customer linking, project linking)
  - [x] 16.1 Add invoices/quotes display to customer detail page
    - Update `src/app/(dashboard)/business/customers/[id]/page.tsx` to fetch and display invoices and quotes linked to that customer
    - Show invoice/quote number, total, status, and link to detail page
    - _Requirements: 10.5_

  - [x] 16.2 Wire project linking in invoice form
    - Add optional project select dropdown to invoice form using existing projects data
    - Store project_id on invoice record
    - _Requirements: 1.14, 10.3_

  - [x] 16.3 Create invoicing overview/dashboard page at `src/app/(dashboard)/business/invoicing/page.tsx`
    - Show summary: total outstanding, total overdue, recent invoices, recent quotes
    - Quick links to create invoice, create quote, manage business profile
    - _Requirements: 1.9, 4.9, 10.4, 10.6_

- [x] 17. Final checkpoint - Ensure all features integrate correctly
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation between major phases
- Property tests validate universal correctness properties from the design document
- The email Edge Function is a stub — full Resend integration is deferred
- All server actions enforce `pro_plus` tier gating before any database operations
- PDF generation uses `@react-pdf/renderer` which is already installed in the project
- Currency formatting uses the existing `formatCurrency` utility from `src/lib/currency.ts`
