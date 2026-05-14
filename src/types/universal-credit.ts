export type UCPeriodStatus = 'draft' | 'ready_to_review' | 'submitted' | 'locked'

export const UC_EXPENSE_CATEGORIES = [
  'materials',
  'mileage_travel',
  'equipment',
  'insurance',
  'office_costs',
  'phone_internet',
  'advertising',
  'professional_fees',
  'other_allowable',
] as const
export type UCExpenseCategory = (typeof UC_EXPENSE_CATEGORIES)[number]

export const UC_PAYMENT_METHODS = [
  'bank_transfer',
  'cash',
  'paypal',
  'stripe',
  'cheque',
  'other',
] as const
export type UCPaymentMethod = (typeof UC_PAYMENT_METHODS)[number]

export interface UCReportingPeriod {
  id: string
  user_id: string
  period_start: string
  period_end: string
  submission_due: string
  status: UCPeriodStatus
  notes: string | null
  submitted_at: string | null
  locked_at: string | null
  created_at: string
  updated_at: string
}

export interface UCIncomeEntry {
  id: string
  user_id: string
  period_id: string
  amount: number
  date_received: string
  source: string
  payment_method: string | null
  linked_invoice_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  evidence_count?: number
}

export interface UCExpenseEntry {
  id: string
  user_id: string
  period_id: string
  amount: number
  date_incurred: string
  category: UCExpenseCategory
  supplier: string | null
  description: string
  linked_expense_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  evidence_count?: number
}

export interface UCEvidenceFile {
  id: string
  user_id: string
  period_id: string | null
  income_entry_id: string | null
  expense_entry_id: string | null
  file_path: string
  file_name: string
  file_size: number
  mime_type: string
  tags: string[]
  notes: string | null
  created_at: string
}

export interface UCAuditEntry {
  id: string
  user_id: string
  period_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  details: Record<string, unknown> | null
  created_at: string
}

export interface UCPeriodSummary {
  period: UCReportingPeriod
  totalIncome: number
  totalExpenses: number
  estimatedProfit: number
  incomeEntries: UCIncomeEntry[]
  expenseEntries: UCExpenseEntry[]
  evidenceCompletionPercent: number
  missingEvidence: MissingEvidenceItem[]
  warnings: string[]
}

export interface MissingEvidenceItem {
  type: 'income' | 'expense'
  id: string
  description: string
  amount: number
}
