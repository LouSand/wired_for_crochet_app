# Design Document: Invoicing System

## Overview

The Invoicing System is a premium module that brings professional invoicing, quoting, payment tracking, PDF generation, and email delivery to the Wired for Crochet app. It ports the functionality of the existing RedKiteApp Flask application into the Next.js 16 / Supabase / TypeScript architecture, adapting the data model for multi-tenant use with Row Level Security.

The module is gated behind a new `pro_plus` subscription tier (above the existing `pro` tier). It integrates with the existing `customers` table, `user_settings`, and `projects` table, and uses `@react-pdf/renderer` (already installed) for client-side PDF generation.

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Tier gating | Add `pro_plus` to `subscription_tier` CHECK | Keeps existing `pro` features intact; clean separation |
| Business profile storage | Add JSON column `business_profile` to `user_settings` | Avoids a new table; profile is 1:1 with user |
| Auto-numbering | `max+1` query per user, formatted as `INV-001` / `QTE-001` | Simpler than sequences for multi-tenant; no cross-user conflicts |
| PDF generation | `@react-pdf/renderer` (React components → PDF blob) | Already in project; runs client-side or in server components |
| Email sending | Interface designed now; implementation via Resend API in Supabase Edge Function (deferred) | Keeps core app decoupled from email provider |
| Logo storage | Supabase Storage bucket `business-assets`, served at known path | Reusable across PDF generation |
| Currency | Use existing `formatCurrency` from `src/lib/currency.ts` with user's configured currency | Consistent with rest of app |

## Architecture

```mermaid
graph TD
    subgraph "Client (Browser)"
        UI[Invoice/Quote Pages]
        PDF[PDF Viewer / Download]
    end

    subgraph "Next.js Server"
        SA[Server Actions]
        Gate[Tier Gate - assertProPlusTier]
        Val[Zod Validators]
        PDFGen[@react-pdf/renderer]
    end

    subgraph "Supabase"
        DB[(PostgreSQL)]
        Auth[Auth]
        Storage[Storage - business-assets]
        Edge[Edge Functions - email]
    end

    UI --> SA
    SA --> Gate
    Gate --> Auth
    SA --> Val
    SA --> DB
    SA --> PDFGen
    PDFGen --> PDF
    SA --> Edge
    Edge -->|Resend API| Email[Email Delivery]
    SA --> Storage
```

### Request Flow

1. User interacts with invoice/quote UI
2. Form submission triggers a Server Action
3. Server Action calls `assertProPlusTier()` — rejects if not `pro_plus`
4. Zod schema validates input
5. Supabase client performs DB operations (RLS enforces user isolation)
6. For PDF: `@react-pdf/renderer` generates a PDF blob returned to client
7. For email: Server Action calls Supabase Edge Function with document data

### File Structure

```
src/
├── app/(dashboard)/business/invoicing/
│   ├── layout.tsx                    # Tier gate wrapper
│   ├── page.tsx                      # Dashboard / overview
│   ├── invoices/
│   │   ├── page.tsx                  # Invoice list
│   │   ├── new/page.tsx              # Create invoice
│   │   └── [id]/
│   │       ├── page.tsx              # View invoice detail
│   │       └── edit/page.tsx         # Edit invoice
│   ├── quotes/
│   │   ├── page.tsx                  # Quote list
│   │   ├── new/page.tsx              # Create quote
│   │   └── [id]/
│   │       ├── page.tsx              # View quote detail
│   │       └── edit/page.tsx         # Edit quote
│   └── settings/
│       └── page.tsx                  # Business profile settings
├── lib/
│   ├── actions/
│   │   ├── invoices.ts               # Invoice server actions
│   │   ├── quotes.ts                 # Quote server actions
│   │   ├── payments.ts               # Payment server actions
│   │   ├── email-sender.ts           # Email sending action
│   │   └── business-profile.ts       # Business profile actions
│   ├── validators/
│   │   ├── invoice.ts                # Zod schemas for invoices
│   │   ├── quote.ts                  # Zod schemas for quotes
│   │   ├── payment.ts                # Zod schemas for payments
│   │   └── business-profile.ts       # Zod schemas for profile
│   └── pdf/
│       ├── invoice-document.tsx      # React PDF invoice template
│       ├── quote-document.tsx        # React PDF quote template
│       └── receipt-document.tsx      # React PDF receipt template
├── components/invoicing/
│   ├── invoice-form.tsx
│   ├── invoice-list.tsx
│   ├── invoice-detail.tsx
│   ├── quote-form.tsx
│   ├── quote-list.tsx
│   ├── payment-form.tsx
│   ├── payment-history.tsx
│   ├── stage-payment-display.tsx
│   ├── pdf-download-button.tsx
│   ├── email-send-button.tsx
│   ├── business-profile-form.tsx
│   └── customer-select.tsx
└── types/
    └── invoicing.ts                  # TypeScript types for invoicing
```

## Components and Interfaces

### Server Actions

#### `src/lib/actions/invoices.ts`

```typescript
// All actions call assertProPlusTier() first

export async function createInvoice(prevState, formData: FormData): Promise<InvoiceActionState>
export async function updateInvoice(id: string, prevState, formData: FormData): Promise<InvoiceActionState>
export async function deleteInvoice(id: string): Promise<InvoiceActionState>
export async function getInvoices(filters?: InvoiceFilters): Promise<{ data: InvoiceRow[] | null; error: string | null }>
export async function getInvoice(id: string): Promise<{ data: InvoiceWithDetails | null; error: string | null }>
export async function getNextInvoiceNumber(): Promise<string>
```

#### `src/lib/actions/quotes.ts`

```typescript
export async function createQuote(prevState, formData: FormData): Promise<QuoteActionState>
export async function updateQuote(id: string, prevState, formData: FormData): Promise<QuoteActionState>
export async function deleteQuote(id: string): Promise<QuoteActionState>
export async function getQuotes(filters?: QuoteFilters): Promise<{ data: QuoteRow[] | null; error: string | null }>
export async function getQuote(id: string): Promise<{ data: QuoteWithDetails | null; error: string | null }>
export async function convertQuoteToInvoice(quoteId: string, dueDate: string): Promise<InvoiceActionState>
export async function getNextQuoteNumber(): Promise<string>
```

#### `src/lib/actions/payments.ts`

```typescript
export async function recordPayment(prevState, formData: FormData): Promise<PaymentActionState>
export async function deletePayment(paymentId: string, invoiceId: string): Promise<PaymentActionState>
export async function getPaymentsForInvoice(invoiceId: string): Promise<{ data: PaymentRow[] | null; error: string | null }>
```

#### `src/lib/actions/business-profile.ts`

```typescript
export async function getBusinessProfile(): Promise<{ data: BusinessProfile | null; error: string | null }>
export async function updateBusinessProfile(prevState, formData: FormData): Promise<ProfileActionState>
export async function uploadBusinessLogo(formData: FormData): Promise<{ url: string | null; error: string | null }>
```

#### `src/lib/actions/email-sender.ts`

```typescript
export async function sendInvoiceEmail(invoiceId: string): Promise<EmailActionState>
export async function sendQuoteEmail(quoteId: string): Promise<EmailActionState>
```

### Tier Gate Extension

```typescript
// src/lib/actions/business-gate.ts — add:
export async function assertProPlusTier(): Promise<{ error: string } | null> {
  const tier = await getSubscriptionTier()
  if (tier !== 'pro_plus' && tier !== 'pro') {
    // For now, pro_plus gates invoicing. We may allow pro users later.
    return { error: 'Pro+ subscription required to access invoicing features.' }
  }
  return null
}
```

> **Design note:** The gate checks for `pro_plus`. The existing `assertProTier()` remains unchanged for business suite features.

### Zod Validators

#### Invoice Schema

```typescript
// src/lib/validators/invoice.ts
export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  unit_price: z.number().positive('Unit price must be positive'),
})

export const invoiceFormSchema = z.object({
  customer_id: z.string().uuid('Customer is required'),
  issue_date: z.string().date('Valid issue date required'),
  due_date: z.string().date('Valid due date required'),
  items: z.array(invoiceItemSchema).min(1, 'At least one line item is required'),
  deposit_percent: z.number().int().min(0).max(100).default(40),
  stage2_percent: z.number().int().min(0).max(100).default(40),
  final_percent: z.number().int().min(0).max(100).default(20),
  project_id: z.string().uuid().optional().nullable(),
}).refine(
  (data) => data.deposit_percent + data.stage2_percent + data.final_percent === 100,
  { message: 'Stage percentages must sum to 100' }
)
```

#### Quote Schema

```typescript
// src/lib/validators/quote.ts
export const quoteItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  unit_price: z.number().positive('Unit price must be positive'),
})

export const quoteFormSchema = z.object({
  customer_id: z.string().uuid('Customer is required'),
  issue_date: z.string().date('Valid issue date required'),
  items: z.array(quoteItemSchema).min(1, 'At least one line item is required'),
})
```

#### Payment Schema

```typescript
// src/lib/validators/payment.ts
export const paymentFormSchema = z.object({
  invoice_id: z.string().uuid('Invoice reference is required'),
  amount: z.number().positive('Amount must be positive'),
  payment_date: z.string().date('Valid payment date required'),
})
```

#### Business Profile Schema

```typescript
// src/lib/validators/business-profile.ts
export const businessProfileSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  address: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  bank_account_name: z.string().optional().default(''),
  bank_account_number: z.string().optional().default(''),
  bank_sort_code: z.string()
    .regex(/^\d{2}-\d{2}-\d{2}$/, 'Sort code must be in format XX-XX-XX')
    .optional()
    .or(z.literal('')),
  logo_url: z.string().url().optional().nullable(),
})
```

### PDF Components

Using `@react-pdf/renderer`, each document type is a React component:

```typescript
// src/lib/pdf/invoice-document.tsx
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'

interface InvoicePDFProps {
  invoice: InvoiceWithDetails
  businessProfile: BusinessProfile
  currency: string
}

export function InvoicePDFDocument({ invoice, businessProfile, currency }: InvoicePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with logo and business details */}
        {/* Invoice number, dates, client details */}
        {/* Line items table */}
        {/* Total */}
        {/* Stage payment breakdown with status badges */}
        {/* Payment history */}
        {/* Bank details */}
        {/* Footer */}
      </Page>
    </Document>
  )
}
```

### Email Interface

The email sending is designed as a Supabase Edge Function that accepts:

```typescript
interface SendEmailRequest {
  to: string
  subject: string
  body: string
  attachments: Array<{
    filename: string
    content: string // base64-encoded PDF
    contentType: 'application/pdf'
  }>
}
```

The server action generates the PDF, base64-encodes it, and calls the Edge Function. The Edge Function uses Resend (or SendGrid) to deliver.

## Data Models

### Database Schema

#### Subscription Tier Update

```sql
-- Alter the CHECK constraint on user_settings to add 'pro_plus'
ALTER TABLE user_settings
  DROP CONSTRAINT user_settings_subscription_tier_check;

ALTER TABLE user_settings
  ADD CONSTRAINT user_settings_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'pro', 'pro_plus'));
```

#### Business Profile (JSON column on user_settings)

```sql
ALTER TABLE user_settings
  ADD COLUMN business_profile jsonb DEFAULT NULL;

-- Example value:
-- {
--   "company_name": "Wired for Crochet",
--   "address": "123 Craft Lane, Machynlleth, SY20 8QJ",
--   "phone": "07841 518967",
--   "email": "hello@wiredforcrochet.com",
--   "bank_account_name": "Wired for Crochet",
--   "bank_account_number": "12345678",
--   "bank_sort_code": "12-34-56",
--   "logo_url": "https://xxx.supabase.co/storage/v1/object/public/business-assets/user-id/logo.png"
-- }
```

#### Invoices Table

```sql
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
  quote_id uuid REFERENCES quotes ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, invoice_number),
  CHECK (deposit_percent + stage2_percent + final_percent = 100),
  CHECK (deposit_percent >= 0 AND stage2_percent >= 0 AND final_percent >= 0)
);
```

#### Invoice Items Table

```sql
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
```

#### Quotes Table

```sql
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
```

#### Quote Items Table

```sql
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
```

#### Payments Table

```sql
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### Email Logs Table

```sql
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
```

### Row Level Security

All new tables follow the same pattern as existing business suite tables:

```sql
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Example for invoices (same pattern for all):
CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own invoices" ON invoices FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own invoices" ON invoices FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own invoices" ON invoices FOR DELETE USING (user_id = auth.uid());
```

### Indexes

```sql
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
```

### TypeScript Types

```typescript
// src/types/invoicing.ts

export const INVOICE_STATUSES = ['draft', 'unpaid', 'partial', 'paid', 'overdue'] as const
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]

export const QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'rejected', 'expired'] as const
export type QuoteStatus = (typeof QUOTE_STATUSES)[number]

export interface InvoiceRow {
  id: string
  user_id: string
  customer_id: string
  project_id: string | null
  invoice_number: string
  issue_date: string
  due_date: string
  total: number
  amount_paid: number
  status: InvoiceStatus
  deposit_percent: number
  stage2_percent: number
  final_percent: number
  quote_id: string | null
  created_at: string
  updated_at: string
}

export interface InvoiceItemRow {
  id: string
  invoice_id: string
  user_id: string
  description: string
  quantity: number
  unit_price: number
  line_total: number
  sort_order: number
  created_at: string
}

export interface InvoiceWithDetails extends InvoiceRow {
  items: InvoiceItemRow[]
  payments: PaymentRow[]
  customer: { id: string; name: string; email: string | null; address: string | null }
  email_logs: EmailLogRow[]
}

export interface QuoteRow {
  id: string
  user_id: string
  customer_id: string
  quote_number: string
  issue_date: string
  total: number
  status: QuoteStatus
  created_at: string
  updated_at: string
}

export interface QuoteItemRow {
  id: string
  quote_id: string
  user_id: string
  description: string
  quantity: number
  unit_price: number
  line_total: number
  sort_order: number
  created_at: string
}

export interface QuoteWithDetails extends QuoteRow {
  items: QuoteItemRow[]
  customer: { id: string; name: string; email: string | null; address: string | null }
  email_logs: EmailLogRow[]
}

export interface PaymentRow {
  id: string
  invoice_id: string
  user_id: string
  amount: number
  payment_date: string
  created_at: string
}

export interface EmailLogRow {
  id: string
  user_id: string
  document_type: 'invoice' | 'quote'
  document_id: string
  recipient: string
  subject: string | null
  sent_at: string
  send_count: number
}

export interface BusinessProfile {
  company_name: string
  address: string
  phone: string
  email: string
  bank_account_name: string
  bank_account_number: string
  bank_sort_code: string
  logo_url: string | null
}

export interface InvoiceFilters {
  status?: InvoiceStatus
  customer_id?: string
  overdue_only?: boolean
}

export interface QuoteFilters {
  status?: QuoteStatus
  customer_id?: string
}
```

### Auto-Numbering Logic

```typescript
async function getNextInvoiceNumber(supabase, userId: string): Promise<string> {
  const { data } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (!data || data.length === 0) {
    return 'INV-001'
  }

  const lastNum = parseInt(data[0].invoice_number.replace('INV-', ''), 10)
  return `INV-${String(lastNum + 1).padStart(3, '0')}`
}
```

Same pattern for quotes with `QTE-` prefix.

### Storage Bucket

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-assets',
  'business-assets',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png']
);
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Line item total calculation

*For any* invoice item or quote item with a positive integer quantity and a positive unit price, the line total SHALL equal quantity multiplied by unit price.

**Validates: Requirements 1.3, 4.3**

### Property 2: Document total equals sum of line totals

*For any* invoice or quote with one or more line items, the document total SHALL equal the sum of all line item totals (each being quantity × unit_price).

**Validates: Requirements 1.4, 4.4**

### Property 3: Sequential document numbering

*For any* user with N existing invoices (or quotes), the next generated number SHALL be the prefix followed by N+1 zero-padded to 3 digits, and the format SHALL match `INV-XXX` or `QTE-XXX` where X is a digit.

**Validates: Requirements 1.2, 4.2**

### Property 4: Schema validation rejects invalid inputs

*For any* invoice, quote, or payment input that is missing a required field (customer, date, items, amount) or contains an invalid value (non-positive quantity, non-positive price, empty description), the Zod validator SHALL return a failure result and the input SHALL not be persisted.

**Validates: Requirements 1.11, 1.12, 1.13, 3.7, 4.10, 4.11, 4.12**

### Property 5: Stage percentages must sum to 100

*For any* three integer values representing deposit_percent, stage2_percent, and final_percent, the invoice validator SHALL accept them if and only if their sum equals exactly 100 and each is non-negative.

**Validates: Requirements 2.4**

### Property 6: Stage coverage determination

*For any* invoice with total T, stage percentages (d%, s%, f%), and cumulative amount_paid P:
- Deposit is covered iff P >= T × d/100
- Stage 2 is covered iff P >= T × (d + s)/100
- Final is covered iff P >= T

**Validates: Requirements 2.6, 2.7**

### Property 7: Payment recording updates status correctly

*For any* invoice with total T and current amount_paid A, when a valid payment of amount X is recorded (where A + X <= T):
- The new amount_paid SHALL equal A + X
- If A + X == T, status SHALL be "paid"
- If 0 < A + X < T, status SHALL be "partial"

**Validates: Requirements 3.2, 3.3, 3.4, 11.2**

### Property 8: Payment deletion reverses amount_paid

*For any* invoice with recorded payments, deleting a payment of amount X SHALL reduce amount_paid by exactly X, and the resulting status SHALL be recalculated based on the new amount_paid relative to total.

**Validates: Requirements 3.9**

### Property 9: Payment history ordering

*For any* invoice with multiple payments, the payment history SHALL be returned ordered by payment_date descending (most recent first).

**Validates: Requirements 3.6**

### Property 10: Overpayment rejection

*For any* invoice with total T and current amount_paid A, attempting to record a payment of amount X where A + X > T SHALL be rejected by validation.

**Validates: Requirements 3.8**

### Property 11: Status-gated mutations

*For any* invoice with status S, editing SHALL succeed if and only if S ∈ {draft, unpaid}, and deletion SHALL succeed if and only if S = draft. For any quote with status S, editing and deletion SHALL succeed if and only if S = draft. Quote-to-invoice conversion SHALL succeed if and only if S ∈ {draft, sent}.

**Validates: Requirements 1.7, 1.8, 4.7, 4.8, 5.4**

### Property 12: Quote-to-invoice data preservation

*For any* quote with customer C, line items I, and total T, converting it to an invoice SHALL produce an invoice with the same customer C, identical line items (descriptions, quantities, prices), and the same total T.

**Validates: Requirements 5.1**

### Property 13: PDF contains all required sections

*For any* invoice (with business profile, items, payments, and stage breakdown), the rendered PDF component tree SHALL contain: business name, invoice number, client name, issue date, due date, all item descriptions, invoice total, each stage label with amount, payment history entries, remaining balance, and bank details.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.6**

### Property 14: Email send count increment

*For any* document that has been emailed N times, re-sending SHALL result in the email_log send_count being exactly N + 1.

**Validates: Requirements 7.4**

### Property 15: Email requires client email

*For any* invoice or quote whose linked customer has a null or empty email address, attempting to send an email SHALL be rejected with an error message indicating the email is missing.

**Validates: Requirements 7.6**

### Property 16: Draft status transitions on email send

*For any* invoice with status "draft", sending it by email SHALL change the status to "unpaid". For any quote with status "draft", sending it by email SHALL change the status to "sent".

**Validates: Requirements 7.7, 7.8**

### Property 17: Business profile round-trip

*For any* valid business profile data (company name, address, phone, email, bank details), saving it and then fetching it SHALL return identical values for all fields.

**Validates: Requirements 8.1, 8.3**

### Property 18: Sort code format validation

*For any* string, the business profile validator SHALL accept it as a valid sort code if and only if it matches the pattern `XX-XX-XX` where each X is a digit (0-9).

**Validates: Requirements 8.6**

### Property 19: Tier gate enforcement

*For any* user whose subscription_tier is not "pro_plus", calling any invoicing server action SHALL return an error. For any user with subscription_tier "pro_plus", the tier check SHALL pass.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

### Property 20: Overdue status detection

*For any* invoice with due_date before the current date and status in {"unpaid", "partial"}, the overdue check SHALL update the status to "overdue". Invoices with status "draft", "paid", or due_date >= today SHALL not be affected.

**Validates: Requirements 11.1**

## Error Handling

### Validation Errors

| Scenario | Handling |
|----------|----------|
| Missing required fields (customer, dates, items) | Zod validation returns field-level errors; form displays inline messages |
| Invalid item values (non-positive qty/price) | Zod rejects; form highlights the specific item row |
| Stage percentages don't sum to 100 | Zod refine rejects; form shows error near percentage inputs |
| Overpayment attempt | Server action checks amount_paid + new amount <= total before insert |
| Invalid sort code format | Zod regex rejects; form shows format hint |

### Authorization Errors

| Scenario | Handling |
|----------|----------|
| Free-tier user accesses invoicing page | Layout component shows upgrade prompt |
| Free-tier user calls server action | Action returns `{ error: 'Pro+ subscription required...' }` |
| User attempts to access another user's invoice | RLS blocks the query; action returns "not found" |

### Business Logic Errors

| Scenario | Handling |
|----------|----------|
| Edit non-draft/non-unpaid invoice | Server action checks status before update; returns error |
| Delete non-draft invoice/quote | Server action checks status; returns error |
| Convert non-draft/non-sent quote | Server action checks status; returns error |
| Send email to customer without email | Server action checks customer.email; returns descriptive error |
| Email service unavailable | Edge function returns error; UI shows "email failed, try again later" |

### Database Errors

| Scenario | Handling |
|----------|----------|
| Unique constraint violation (invoice number race) | Retry with next number (max 3 attempts) |
| Foreign key violation (deleted customer) | ON DELETE RESTRICT prevents; UI shows error |
| Network/timeout | Generic "please try again" message |

### PDF Generation Errors

| Scenario | Handling |
|----------|----------|
| Missing business profile | PDF renders without header; shows setup prompt on page |
| Missing logo | PDF renders without logo image |
| Invalid data | Graceful fallback with "N/A" for missing fields |

## Testing Strategy

### Property-Based Testing

This feature is well-suited for property-based testing due to its pure calculation logic, validation rules, and state transition behaviour.

**Library:** `fast-check` (already installed as dev dependency)
**Minimum iterations:** 100 per property test
**Tag format:** `Feature: invoicing-system, Property {N}: {title}`

Property tests will cover:
- Line item and document total calculations (Properties 1, 2)
- Sequential numbering logic (Property 3)
- Zod schema validation — valid inputs pass, invalid inputs fail (Properties 4, 5, 18)
- Stage coverage computation (Property 6)
- Payment status transition logic (Properties 7, 8, 10)
- Status-gated mutation checks (Property 11)
- Quote-to-invoice data preservation (Property 12)
- Tier gate logic (Property 19)
- Overdue detection logic (Property 20)

### Unit Tests (Example-Based)

- Invoice creation sets status to "draft"
- Quote creation sets status to "draft"
- Default stage percentages are 40/40/20
- Customer search returns matching results
- PDF renders with and without business profile/logo
- Email log is created on send
- Overdue invoices have visual indicator in list data

### Integration Tests

- Full invoice lifecycle: create → add payment → mark paid
- Quote-to-invoice conversion flow
- Email sending via Edge Function (mocked)
- PDF download endpoint returns valid blob
- RLS prevents cross-user access
- Tier gate blocks free users at both UI and action layers

### Test File Structure

```
src/
├── lib/
│   ├── validators/
│   │   └── __tests__/
│   │       ├── invoice.test.ts        # Property tests for invoice schema
│   │       ├── quote.test.ts          # Property tests for quote schema
│   │       ├── payment.test.ts        # Property tests for payment schema
│   │       └── business-profile.test.ts
│   ├── actions/
│   │   └── __tests__/
│   │       ├── invoices.test.ts       # Integration tests for invoice actions
│   │       ├── quotes.test.ts
│   │       ├── payments.test.ts
│   │       └── business-gate.test.ts  # Property tests for tier logic
│   └── pdf/
│       └── __tests__/
│           └── invoice-document.test.ts  # Property tests for PDF content
├── components/invoicing/
│   └── __tests__/
│       └── stage-payment-display.test.ts  # Property tests for stage coverage
└── __tests__/
    └── invoicing/
        ├── calculations.property.test.ts  # Properties 1, 2, 3
        ├── validation.property.test.ts    # Properties 4, 5, 18
        ├── payments.property.test.ts      # Properties 6, 7, 8, 9, 10
        ├── status-gates.property.test.ts  # Properties 11, 16, 19, 20
        └── conversion.property.test.ts    # Property 12
```
