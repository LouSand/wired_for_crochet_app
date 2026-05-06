/**
 * TypeScript types for the Invoicing System feature.
 * Covers invoices, quotes, payments, email logs, and business profile.
 */

// ============================================================
// Status constants
// ============================================================

export const INVOICE_STATUSES = ['draft', 'unpaid', 'partial', 'paid', 'overdue'] as const
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]

export const QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'rejected', 'expired'] as const
export type QuoteStatus = (typeof QUOTE_STATUSES)[number]

// ============================================================
// Invoice types
// ============================================================

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

// ============================================================
// Quote types
// ============================================================

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

// ============================================================
// Payment types
// ============================================================

export interface PaymentRow {
  id: string
  invoice_id: string
  user_id: string
  amount: number
  payment_date: string
  created_at: string
}

// ============================================================
// Email log types
// ============================================================

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

// ============================================================
// Business profile types
// ============================================================

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

// ============================================================
// Filter types
// ============================================================

export interface InvoiceFilters {
  status?: InvoiceStatus
  customer_id?: string
  overdue_only?: boolean
}

export interface QuoteFilters {
  status?: QuoteStatus
  customer_id?: string
}

// ============================================================
// Action state types
// ============================================================

export interface InvoiceActionState {
  success: boolean
  error: string | null
  fieldErrors?: Record<string, string[]>
  data?: InvoiceRow | null
}

export interface QuoteActionState {
  success: boolean
  error: string | null
  fieldErrors?: Record<string, string[]>
  data?: QuoteRow | null
}

export interface PaymentActionState {
  success: boolean
  error: string | null
  fieldErrors?: Record<string, string[]>
  data?: PaymentRow | null
}

export interface ProfileActionState {
  success: boolean
  error: string | null
  fieldErrors?: Record<string, string[]>
  data?: BusinessProfile | null
}

export interface EmailActionState {
  success: boolean
  error: string | null
}
