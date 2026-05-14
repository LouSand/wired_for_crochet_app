'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface MTDThreshold {
  id: string
  threshold_amount: number
  start_date: string
  description: string
}

export interface MTDEligibility {
  qualifyingIncome: number | null
  thresholds: MTDThreshold[]
  likelyStartDate: string | null
  isRequired: boolean
  message: string
}

export interface QuarterlyUpdate {
  id: string
  tax_year: number
  quarter: number
  period_start: string
  period_end: string
  deadline: string
  income: number
  expenses: number
  profit: number
  status: string
  notes: string | null
}

export interface DigitalRecordsCheck {
  totalRecords: number
  completeRecords: number
  incompleteRecords: Array<{ id: string; type: string; issue: string; description: string }>
  completionPercent: number
}

// ─── Eligibility ─────────────────────────────────────────────────────────────

export async function checkMTDEligibility(): Promise<{ data: MTDEligibility | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  // Get qualifying income from tax config
  const { data: config } = await supabase
    .from('tax_config')
    .select('qualifying_income')
    .eq('user_id', user.id)
    .single()

  // Get thresholds
  const { data: thresholds } = await supabase
    .from('hmrc_mtd_thresholds')
    .select('*')
    .order('start_date', { ascending: true })

  const allThresholds = (thresholds ?? []) as MTDThreshold[]
  const qualifyingIncome = config?.qualifying_income ?? null

  let likelyStartDate: string | null = null
  let isRequired = false
  let message = 'Enter your qualifying income in Settings to check eligibility.'

  if (qualifyingIncome !== null) {
    // Find the first threshold the user exceeds
    for (const t of allThresholds) {
      if (qualifyingIncome > t.threshold_amount) {
        likelyStartDate = t.start_date
        isRequired = true
        message = `Based on your qualifying income of £${qualifyingIncome.toLocaleString()}, you'll likely need MTD from ${new Date(t.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`
        break
      }
    }

    if (!isRequired) {
      message = `Your qualifying income of £${qualifyingIncome.toLocaleString()} is below current MTD thresholds. You're not required to use MTD yet.`
    }
  }

  return {
    data: { qualifyingIncome, thresholds: allThresholds, likelyStartDate, isRequired, message },
    error: null,
  }
}

// ─── Quarterly Updates ───────────────────────────────────────────────────────

export async function getQuarterlyUpdates(taxYear: number): Promise<{ data: QuarterlyUpdate[]; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('hmrc_mtd_quarterly_updates')
    .select('*')
    .eq('user_id', user.id)
    .eq('tax_year', taxYear)
    .order('quarter', { ascending: true })

  if (error) return { data: [], error: 'Failed to fetch quarterly updates.' }
  return { data: (data ?? []) as QuarterlyUpdate[], error: null }
}

export async function generateQuarterlyUpdates(taxYear: number): Promise<{ created: number; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { created: 0, error: 'Not authenticated' }

  // Define quarters for the tax year (6 Apr to 5 Apr)
  const quarters = [
    { quarter: 1, start: `${taxYear - 1}-04-06`, end: `${taxYear - 1}-07-05`, deadline: `${taxYear - 1}-08-05` },
    { quarter: 2, start: `${taxYear - 1}-07-06`, end: `${taxYear - 1}-10-05`, deadline: `${taxYear - 1}-11-05` },
    { quarter: 3, start: `${taxYear - 1}-10-06`, end: `${taxYear}-01-05`, deadline: `${taxYear}-02-05` },
    { quarter: 4, start: `${taxYear}-01-06`, end: `${taxYear}-04-05`, deadline: `${taxYear}-05-05` },
  ]

  // Calculate income/expenses for each quarter
  let created = 0
  for (const q of quarters) {
    // Get income (paid invoices in this quarter)
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('user_id', user.id)
      .gte('payment_date', q.start)
      .lte('payment_date', q.end)

    const income = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0)

    // Get expenses in this quarter
    const { data: expenses } = await supabase
      .from('purchases')
      .select('cost, business_use_percentage')
      .eq('user_id', user.id)
      .gte('purchase_date', q.start)
      .lte('purchase_date', q.end)

    const totalExpenses = (expenses ?? []).reduce((s, e) => s + (Number(e.cost) * (e.business_use_percentage ?? 100) / 100), 0)

    const { error } = await supabase
      .from('hmrc_mtd_quarterly_updates')
      .upsert({
        user_id: user.id,
        tax_year: taxYear,
        quarter: q.quarter,
        period_start: q.start,
        period_end: q.end,
        deadline: q.deadline,
        income,
        expenses: totalExpenses,
        profit: income - totalExpenses,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,tax_year,quarter' })

    if (!error) created++
  }

  revalidatePath('/business/tax-return/mtd-readiness')
  return { created, error: null }
}

// ─── Digital Records Completeness ────────────────────────────────────────────

export async function checkDigitalRecords(taxYear: number): Promise<{ data: DigitalRecordsCheck | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const taxYearStart = `${taxYear - 1}-04-06`
  const taxYearEnd = `${taxYear}-04-05`

  const incompleteRecords: Array<{ id: string; type: string; issue: string; description: string }> = []

  // Check expenses
  const { data: expenses } = await supabase
    .from('purchases')
    .select('id, purchase_date, description, cost, category')
    .eq('user_id', user.id)
    .gte('purchase_date', taxYearStart)
    .lte('purchase_date', taxYearEnd)

  let totalRecords = 0
  let completeRecords = 0

  for (const exp of expenses ?? []) {
    totalRecords++
    const issues: string[] = []
    if (!exp.description || exp.description.trim().length < 3) issues.push('Missing description')
    if (!exp.category) issues.push('Missing category')
    if (!exp.cost || exp.cost <= 0) issues.push('Invalid amount')

    if (issues.length === 0) {
      completeRecords++
    } else {
      incompleteRecords.push({
        id: exp.id,
        type: 'expense',
        issue: issues.join(', '),
        description: exp.description || 'No description',
      })
    }
  }

  // Check invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, total, issue_date, customer_id')
    .eq('user_id', user.id)
    .gte('issue_date', taxYearStart)
    .lte('issue_date', taxYearEnd)

  for (const inv of invoices ?? []) {
    totalRecords++
    const issues: string[] = []
    if (!inv.customer_id) issues.push('No customer linked')
    if (!inv.total || inv.total <= 0) issues.push('Invalid amount')

    if (issues.length === 0) {
      completeRecords++
    } else {
      incompleteRecords.push({
        id: inv.id,
        type: 'invoice',
        issue: issues.join(', '),
        description: `Invoice ${inv.invoice_number}`,
      })
    }
  }

  const completionPercent = totalRecords > 0 ? Math.round((completeRecords / totalRecords) * 100) : 100

  return { data: { totalRecords, completeRecords, incompleteRecords, completionPercent }, error: null }
}
