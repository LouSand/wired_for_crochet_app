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
    // New SA103-aligned categories
    case 'cost_of_goods':
    case 'stock':
      return { box: 11, label: 'Cost of goods bought for resale or goods used' }
    case 'travel':
      return { box: 12, label: 'Car, van and travel expenses' }
    case 'staff_costs':
      return { box: 13, label: 'Wages, salaries and other staff costs' }
    case 'premises':
      return { box: 14, label: 'Rent, rates, power and insurance costs' }
    case 'repairs':
      return { box: 15, label: 'Repairs and maintenance of property and equipment' }
    case 'professional_fees':
      return { box: 16, label: 'Accountancy, legal and other professional fees' }
    case 'finance_charges':
      return { box: 17, label: 'Interest on bank and other loans and finance charges' }
    case 'office_costs':
    case 'office_supplies':
    case 'subscription':
      return { box: 18, label: 'Phone, fax, stationery and other office costs' }
    case 'other_expenses':
    case 'equipment':
    case 'books':
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

// ─── Tax Config ──────────────────────────────────────────────────────────────

import type { TaxConfig, TaxEstimate, EvidenceStatus, YearEndChecklist, TaxYearStatus } from '@/types/tax'

export async function getTaxConfig(): Promise<{ data: TaxConfig | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('tax_config')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code === 'PGRST116') {
    // No config yet — create default
    const { data: newConfig } = await supabase
      .from('tax_config')
      .insert({ user_id: user.id })
      .select()
      .single()
    return { data: newConfig as TaxConfig | null, error: null }
  }

  if (error) return { data: null, error: 'Failed to fetch tax config.' }
  return { data: data as TaxConfig, error: null }
}

export async function updateTaxConfig(formData: FormData): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const accountingBasis = formData.get('accounting_basis') as string
  const personalAllowance = parseFloat(formData.get('personal_allowance') as string)
  const qualifyingIncome = formData.get('qualifying_income') as string

  const { error } = await supabase
    .from('tax_config')
    .upsert({
      user_id: user.id,
      accounting_basis: accountingBasis || 'cash',
      personal_allowance: isNaN(personalAllowance) ? 12570 : personalAllowance,
      qualifying_income: qualifyingIncome ? parseFloat(qualifyingIncome) : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) return { error: 'Failed to save tax config.' }
  return { error: null }
}

// ─── Tax Estimate Calculator ─────────────────────────────────────────────────

export async function calculateTaxEstimate(taxYearEnd: number): Promise<{
  data: TaxEstimate | null
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  // Get tax config
  const { data: config } = await getTaxConfig()
  if (!config) return { data: null, error: 'Tax config not found.' }

  // Get SA103 summary for the profit figure
  const { data: summary } = await generateTaxSummary(taxYearEnd)
  if (!summary) return { data: null, error: 'Could not generate tax summary.' }

  const taxableProfit = Math.max(0, summary.box21_netProfit)
  const personalAllowance = config.personal_allowance
  const taxableAfterAllowance = Math.max(0, taxableProfit - personalAllowance)

  // Income tax bands
  const basicRateLimit = config.basic_rate_threshold - personalAllowance
  const higherRateLimit = config.higher_rate_threshold - personalAllowance

  let basicRate = 0
  let higherRate = 0
  let additionalRate = 0

  if (taxableAfterAllowance > 0) {
    const basicTaxable = Math.min(taxableAfterAllowance, basicRateLimit)
    basicRate = basicTaxable * 0.20

    if (taxableAfterAllowance > basicRateLimit) {
      const higherTaxable = Math.min(taxableAfterAllowance - basicRateLimit, higherRateLimit - basicRateLimit)
      higherRate = higherTaxable * 0.40

      if (taxableAfterAllowance > higherRateLimit) {
        const additionalTaxable = taxableAfterAllowance - higherRateLimit
        additionalRate = additionalTaxable * 0.45
      }
    }
  }

  const totalIncomeTax = basicRate + higherRate + additionalRate

  // National Insurance
  let class2 = 0
  let class4 = 0

  if (taxableProfit > config.class4_lower_threshold) {
    // Class 2: flat rate per week (52 weeks)
    class2 = config.class2_weekly_rate * 52

    // Class 4
    const class4Lower = Math.min(taxableProfit, config.class4_upper_threshold) - config.class4_lower_threshold
    class4 = class4Lower * (config.class4_lower_rate / 100)

    if (taxableProfit > config.class4_upper_threshold) {
      const class4Upper = taxableProfit - config.class4_upper_threshold
      class4 += class4Upper * (config.class4_upper_rate / 100)
    }
  }

  const totalNI = class2 + class4
  const totalTaxDue = totalIncomeTax + totalNI
  const effectiveRate = taxableProfit > 0 ? (totalTaxDue / taxableProfit) * 100 : 0

  return {
    data: {
      taxableProfit,
      personalAllowance,
      taxableAfterAllowance,
      incomeTax: { basicRate, higherRate, additionalRate, total: totalIncomeTax },
      nationalInsurance: { class2, class4, total: totalNI },
      totalTaxDue,
      effectiveRate: Math.round(effectiveRate * 10) / 10,
    },
    error: null,
  }
}

// ─── Evidence Completeness ───────────────────────────────────────────────────

export async function getEvidenceStatus(taxYearEnd: number): Promise<{
  data: EvidenceStatus | null
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const taxYearStart = `${taxYearEnd - 1}-04-06`
  const taxYearEndDate = `${taxYearEnd}-04-05`

  // Expenses
  const { data: expenses } = await supabase
    .from('purchases')
    .select('id, purchase_date, description, cost, invoice_path')
    .eq('user_id', user.id)
    .gte('purchase_date', taxYearStart)
    .lte('purchase_date', taxYearEndDate)

  const allExpenses = expenses ?? []
  const expensesWithEvidence = allExpenses.filter((e) => e.invoice_path)
  const expensesWithoutEvidence = allExpenses
    .filter((e) => !e.invoice_path)
    .map((e) => ({ id: e.id, date: e.purchase_date, description: e.description, amount: e.cost }))

  // Income (invoices)
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, issue_date, invoice_number, total, status')
    .eq('user_id', user.id)
    .gte('issue_date', taxYearStart)
    .lte('issue_date', taxYearEndDate)

  const allInvoices = invoices ?? []
  const paidInvoices = allInvoices.filter((i) => i.status === 'paid')
  // Invoices are their own evidence (they're generated by the system)
  const incomeWithoutEvidence = allInvoices
    .filter((i) => i.status !== 'paid' && i.status !== 'draft')
    .map((i) => ({ id: i.id, date: i.issue_date, description: `Invoice ${i.invoice_number}`, amount: i.total }))

  const totalItems = allExpenses.length + paidInvoices.length
  const itemsWithEvidence = expensesWithEvidence.length + paidInvoices.length
  const completionPercent = totalItems > 0 ? Math.round((itemsWithEvidence / totalItems) * 100) : 100

  // Warnings
  const warnings: string[] = []
  if (expensesWithoutEvidence.length > 0) {
    warnings.push(`${expensesWithoutEvidence.length} expense(s) missing receipts`)
  }
  if (incomeWithoutEvidence.length > 0) {
    warnings.push(`${incomeWithoutEvidence.length} invoice(s) unpaid/unresolved`)
  }

  return {
    data: {
      totalExpenses: allExpenses.length,
      expensesWithEvidence: expensesWithEvidence.length,
      expensesWithoutEvidence,
      totalIncome: paidInvoices.length,
      incomeWithEvidence: paidInvoices.length,
      incomeWithoutEvidence,
      completionPercent,
      warnings,
    },
    error: null,
  }
}

// ─── Year-End Checklist ──────────────────────────────────────────────────────

export async function getChecklist(taxYear: number): Promise<{
  data: { checklist: YearEndChecklist; status: TaxYearStatus } | null
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('tax_year_checklists')
    .select('checklist_data, status')
    .eq('user_id', user.id)
    .eq('tax_year', taxYear)
    .single()

  if (error && error.code === 'PGRST116') {
    // Create default
    const defaultChecklist: YearEndChecklist = {
      receipts_uploaded: 'not_done',
      stock_valued: 'not_done',
      mileage_complete: 'not_done',
      use_of_home: 'not_done',
      capital_purchases: 'not_done',
      private_use_adjustments: 'not_done',
      trading_allowance: 'not_done',
      bad_debts: 'not_done',
      accountant_review: 'not_done',
      final_review: 'not_done',
    }
    return { data: { checklist: defaultChecklist, status: 'draft' }, error: null }
  }

  if (error) return { data: null, error: 'Failed to fetch checklist.' }
  return { data: { checklist: data.checklist_data as YearEndChecklist, status: data.status as TaxYearStatus }, error: null }
}

export async function saveChecklist(
  taxYear: number,
  checklist: YearEndChecklist,
  status: TaxYearStatus
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('tax_year_checklists')
    .upsert({
      user_id: user.id,
      tax_year: taxYear,
      checklist_data: checklist,
      status,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,tax_year' })

  if (error) return { error: 'Failed to save checklist.' }
  return { error: null }
}
