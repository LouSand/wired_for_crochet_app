'use server'

import { createClient } from '@/lib/supabase/server'
import { assertProTier } from './business-gate'

/**
 * UK Self Assessment SA103 (Self-Employment) box mapping.
 * Based on the 2023/24 and 2024/25 SA103 form structure.
 *
 * This generates a summary of your business income and expenses
 * mapped to the relevant SA103 box numbers for easy data entry.
 */

export interface SA103Summary {
  taxYear: string
  taxYearStart: string
  taxYearEnd: string

  // SA103 Section: Business Details
  businessName: string
  businessDescription: string
  accountingPeriodStart: string
  accountingPeriodEnd: string

  // SA103 Box 9: Turnover (total business income)
  box9_turnover: number
  turnoverBreakdown: Array<{ description: string; amount: number }>

  // SA103 Box 10: Any other business income
  box10_otherIncome: number

  // SA103 Expenses (Boxes 11-19)
  box11_costOfGoods: number        // Cost of goods bought for resale or goods used
  box12_carVanTravel: number       // Car, van and travel expenses
  box13_wages: number              // Wages, salaries and other staff costs
  box14_rent: number               // Rent, rates, power and insurance costs
  box15_repairs: number            // Repairs and maintenance of property and equipment
  box16_finance: number            // Accountancy, legal and other professional fees
  box17_interest: number           // Interest and bank/credit card charges
  box18_phone: number              // Phone, fax, stationery and other office costs
  box19_other: number              // Other allowable business expenses

  // SA103 Box 20: Total allowable expenses
  box20_totalExpenses: number

  // SA103 Box 21: Net profit (or loss)
  box21_netProfit: number

  // Expense breakdowns for reference
  expensesByCategory: Array<{
    category: string
    sa103Box: string
    boxNumber: number
    total: number
    items: Array<{ date: string; description: string; amount: number }>
  }>

  // Additional info
  totalInvoicesPaid: number
  totalInvoicesUnpaid: number
  vatRegistered: boolean
  notes: string[]
}

/**
 * Map expense categories to SA103 box numbers.
 */
function mapCategoryToBox(category: string): { box: number; label: string } {
  switch (category) {
    case 'stock':
      return { box: 11, label: 'Cost of goods bought for resale or goods used' }
    case 'equipment':
      return { box: 19, label: 'Other allowable business expenses (equipment/tools)' }
    case 'subscription':
      return { box: 18, label: 'Phone, fax, stationery and other office costs' }
    case 'books':
      return { box: 19, label: 'Other allowable business expenses (books/training)' }
    case 'office_supplies':
      return { box: 18, label: 'Phone, fax, stationery and other office costs' }
    default:
      return { box: 19, label: 'Other allowable business expenses' }
  }
}

/**
 * Generate SA103 tax summary for a given tax year.
 * UK tax year runs 6 April to 5 April.
 */
export async function generateTaxSummary(taxYearEnd: number): Promise<{
  data: SA103Summary | null
  error: string | null
}> {
  const tierCheck = await assertProTier()
  if (tierCheck) return { data: null, error: tierCheck.error }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  // Calculate tax year dates (6 April to 5 April)
  const taxYearStart = `${taxYearEnd - 1}-04-06`
  const taxYearEndDate = `${taxYearEnd}-04-05`
  const taxYearLabel = `${taxYearEnd - 1}/${taxYearEnd.toString().slice(2)}`

  // Fetch user settings for business name
  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Fetch business profile
  const { data: businessProfile } = await supabase
    .from('business_profiles')
    .select('business_name, business_description')
    .eq('user_id', user.id)
    .single()

  // ─── INCOME: Fetch paid invoices in the tax year ───────────────────────────

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, total, amount_paid, status, issue_date')
    .eq('user_id', user.id)
    .gte('issue_date', taxYearStart)
    .lte('issue_date', taxYearEndDate)

  const paidInvoices = (invoices ?? []).filter((inv) => inv.status === 'paid' || inv.amount_paid > 0)
  const unpaidInvoices = (invoices ?? []).filter((inv) => inv.status !== 'paid' && inv.amount_paid === 0)

  // Turnover = total of all paid amounts
  const turnover = paidInvoices.reduce((sum, inv) => sum + (inv.amount_paid || inv.total), 0)
  const turnoverBreakdown = paidInvoices.map((inv) => ({
    description: `Invoice ${inv.invoice_number} (${inv.issue_date})`,
    amount: inv.amount_paid || inv.total,
  }))

  // Also include marketplace sales if any
  const { data: sales } = await supabase
    .from('sales')
    .select('id, sale_date, total_amount, description')
    .eq('user_id', user.id)
    .gte('sale_date', taxYearStart)
    .lte('sale_date', taxYearEndDate)

  const salesTotal = (sales ?? []).reduce((sum, s) => sum + s.total_amount, 0)
  if (salesTotal > 0) {
    turnoverBreakdown.push({
      description: `Direct sales (${(sales ?? []).length} transactions)`,
      amount: salesTotal,
    })
  }

  const totalTurnover = turnover + salesTotal

  // ─── EXPENSES: Fetch all expenses in the tax year ──────────────────────────

  const { data: expenses } = await supabase
    .from('purchases')
    .select('id, purchase_date, description, category, cost')
    .eq('user_id', user.id)
    .gte('purchase_date', taxYearStart)
    .lte('purchase_date', taxYearEndDate)
    .order('purchase_date', { ascending: true })

  // Group expenses by SA103 box
  const expensesByBox: Record<number, { label: string; items: Array<{ date: string; description: string; amount: number; category: string }> }> = {}

  for (const expense of expenses ?? []) {
    const { box, label } = mapCategoryToBox(expense.category)
    if (!expensesByBox[box]) {
      expensesByBox[box] = { label, items: [] }
    }
    expensesByBox[box].items.push({
      date: expense.purchase_date,
      description: expense.description,
      amount: expense.cost,
      category: expense.category,
    })
  }

  // Calculate box totals
  const box11 = expensesByBox[11]?.items.reduce((s, i) => s + i.amount, 0) ?? 0
  const box12 = expensesByBox[12]?.items.reduce((s, i) => s + i.amount, 0) ?? 0
  const box13 = expensesByBox[13]?.items.reduce((s, i) => s + i.amount, 0) ?? 0
  const box14 = expensesByBox[14]?.items.reduce((s, i) => s + i.amount, 0) ?? 0
  const box15 = expensesByBox[15]?.items.reduce((s, i) => s + i.amount, 0) ?? 0
  const box16 = expensesByBox[16]?.items.reduce((s, i) => s + i.amount, 0) ?? 0
  const box17 = expensesByBox[17]?.items.reduce((s, i) => s + i.amount, 0) ?? 0
  const box18 = expensesByBox[18]?.items.reduce((s, i) => s + i.amount, 0) ?? 0
  const box19 = expensesByBox[19]?.items.reduce((s, i) => s + i.amount, 0) ?? 0

  const totalExpenses = box11 + box12 + box13 + box14 + box15 + box16 + box17 + box18 + box19
  const netProfit = totalTurnover - totalExpenses

  // Build expense breakdown for display
  const expensesByCategory = Object.entries(expensesByBox).map(([boxNum, data]) => ({
    category: data.label,
    sa103Box: `Box ${boxNum}`,
    boxNumber: parseInt(boxNum),
    total: data.items.reduce((s, i) => s + i.amount, 0),
    items: data.items,
  }))

  // Notes/warnings
  const notes: string[] = []
  if (unpaidInvoices.length > 0) {
    notes.push(`${unpaidInvoices.length} unpaid invoice(s) not included in turnover (£${unpaidInvoices.reduce((s, i) => s + i.total, 0).toFixed(2)} outstanding)`)
  }
  if (!businessProfile?.business_name) {
    notes.push('Set up your business profile to auto-fill business name on the return')
  }
  notes.push('This summary is for reference only. Always verify figures before submitting your tax return.')
  notes.push('If you use your home for business, you may be able to claim a proportion of household costs (not tracked here).')

  const summary: SA103Summary = {
    taxYear: taxYearLabel,
    taxYearStart,
    taxYearEnd: taxYearEndDate,
    businessName: businessProfile?.business_name ?? 'Not set — update in Business Profile',
    businessDescription: businessProfile?.business_description ?? 'Crochet pattern design and sales',
    accountingPeriodStart: taxYearStart,
    accountingPeriodEnd: taxYearEndDate,
    box9_turnover: totalTurnover,
    turnoverBreakdown,
    box10_otherIncome: 0,
    box11_costOfGoods: box11,
    box12_carVanTravel: box12,
    box13_wages: box13,
    box14_rent: box14,
    box15_repairs: box15,
    box16_finance: box16,
    box17_interest: box17,
    box18_phone: box18,
    box19_other: box19,
    box20_totalExpenses: totalExpenses,
    box21_netProfit: netProfit,
    expensesByCategory,
    totalInvoicesPaid: paidInvoices.length,
    totalInvoicesUnpaid: unpaidInvoices.length,
    vatRegistered: false,
    notes,
  }

  return { data: summary, error: null }
}
