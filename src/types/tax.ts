export type AccountingBasis = 'cash' | 'traditional'
export type TaxYearStatus = 'draft' | 'needs_review' | 'ready' | 'exported'

export interface TaxConfig {
  id: string
  user_id: string
  accounting_basis: AccountingBasis
  personal_allowance: number
  basic_rate_threshold: number
  higher_rate_threshold: number
  class2_weekly_rate: number
  class4_lower_threshold: number
  class4_upper_threshold: number
  class4_lower_rate: number
  class4_upper_rate: number
  qualifying_income: number | null
  created_at: string
  updated_at: string
}

export interface TaxEstimate {
  taxableProfit: number
  personalAllowance: number
  taxableAfterAllowance: number
  incomeTax: {
    basicRate: number
    higherRate: number
    additionalRate: number
    total: number
  }
  nationalInsurance: {
    class2: number
    class4: number
    total: number
  }
  totalTaxDue: number
  effectiveRate: number
}

export interface YearEndChecklist {
  receipts_uploaded: 'done' | 'not_done' | 'not_applicable'
  stock_valued: 'done' | 'not_done' | 'not_applicable'
  mileage_complete: 'done' | 'not_done' | 'not_applicable'
  use_of_home: 'done' | 'not_done' | 'not_applicable'
  capital_purchases: 'done' | 'not_done' | 'not_applicable'
  private_use_adjustments: 'done' | 'not_done' | 'not_applicable'
  trading_allowance: 'done' | 'not_done' | 'not_applicable'
  bad_debts: 'done' | 'not_done' | 'not_applicable'
  accountant_review: 'done' | 'not_done' | 'not_applicable'
  final_review: 'done' | 'not_done' | 'not_applicable'
}

export const CHECKLIST_ITEMS: Array<{ key: keyof YearEndChecklist; label: string; help: string }> = [
  { key: 'receipts_uploaded', label: 'All receipts and invoices uploaded', help: 'Make sure every expense has a receipt or invoice attached as evidence.' },
  { key: 'stock_valued', label: 'Stock/materials on hand valued', help: 'Count and value any unsold stock or unused materials at the year end. This affects your cost of goods.' },
  { key: 'mileage_complete', label: 'Mileage log complete', help: 'If you claim travel expenses, ensure your mileage log covers the full tax year.' },
  { key: 'use_of_home', label: 'Use of home calculated', help: 'If you work from home, calculate the business proportion of household costs (or use the flat rate: £6/week).' },
  { key: 'capital_purchases', label: 'Equipment and capital purchases recorded', help: 'Record any equipment bought during the year. You may be able to claim Annual Investment Allowance.' },
  { key: 'private_use_adjustments', label: 'Private-use adjustments applied', help: 'For any expenses with personal use (phone, car, etc.), set the business use percentage.' },
  { key: 'trading_allowance', label: 'Trading allowance considered', help: 'If your total expenses are under £1,000, you might be better off using the £1,000 trading allowance instead of claiming individual expenses.' },
  { key: 'bad_debts', label: 'Bad debts identified', help: 'If any customers haven\'t paid and won\'t pay, you can write off the debt as an expense.' },
  { key: 'accountant_review', label: 'Accountant review (if applicable)', help: 'If you use an accountant, have them review your figures before submitting.' },
  { key: 'final_review', label: 'Final review — ready for HMRC', help: 'Do a final check of all figures. Once you\'re happy, you can enter them into your Self Assessment online.' },
]

export interface EvidenceStatus {
  totalExpenses: number
  expensesWithEvidence: number
  expensesWithoutEvidence: Array<{ id: string; date: string; description: string; amount: number }>
  totalIncome: number
  incomeWithEvidence: number
  incomeWithoutEvidence: Array<{ id: string; date: string; description: string; amount: number }>
  completionPercent: number
  warnings: string[]
}
