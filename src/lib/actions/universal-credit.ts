'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  UCReportingPeriod,
  UCIncomeEntry,
  UCExpenseEntry,
  UCEvidenceFile,
  UCPeriodSummary,
  MissingEvidenceItem,
  UCPeriodStatus,
} from '@/types/universal-credit'

// ─── Reporting Periods ───────────────────────────────────────────────────────

export async function getUCPeriods(): Promise<{ data: UCReportingPeriod[]; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('uc_reporting_periods')
    .select('*')
    .eq('user_id', user.id)
    .order('period_start', { ascending: false })

  if (error) return { data: [], error: 'Failed to fetch periods.' }
  return { data: (data ?? []) as UCReportingPeriod[], error: null }
}

export async function createUCPeriod(formData: FormData): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const periodStart = formData.get('period_start') as string
  const periodEnd = formData.get('period_end') as string
  const submissionDue = formData.get('submission_due') as string

  if (!periodStart || !periodEnd || !submissionDue) {
    return { error: 'All date fields are required.' }
  }

  const { error } = await supabase.from('uc_reporting_periods').insert({
    user_id: user.id,
    period_start: periodStart,
    period_end: periodEnd,
    submission_due: submissionDue,
    status: 'draft',
  })

  if (error) {
    if (error.code === '23505') return { error: 'A period with this start date already exists.' }
    return { error: 'Failed to create period.' }
  }

  await logAudit(supabase, user.id, null, 'create', 'period', null, { periodStart, periodEnd })
  revalidatePath('/business/universal-credit')
  return { error: null }
}

export async function autoGenerateUCPeriods(monthsAhead: number = 3): Promise<{ created: number; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { created: 0, error: 'Not authenticated' }

  // Get the latest period to continue from
  const { data: latest } = await supabase
    .from('uc_reporting_periods')
    .select('period_end')
    .eq('user_id', user.id)
    .order('period_end', { ascending: false })
    .limit(1)
    .single()

  let startDate: Date
  if (latest) {
    startDate = new Date(latest.period_end)
    startDate.setDate(startDate.getDate() + 1)
  } else {
    // Start from beginning of current month
    startDate = new Date()
    startDate.setDate(1)
  }

  let created = 0
  for (let i = 0; i < monthsAhead; i++) {
    const periodStart = new Date(startDate)
    periodStart.setMonth(periodStart.getMonth() + i)

    const periodEnd = new Date(periodStart)
    periodEnd.setMonth(periodEnd.getMonth() + 1)
    periodEnd.setDate(periodEnd.getDate() - 1)

    const submissionDue = new Date(periodEnd)
    submissionDue.setDate(submissionDue.getDate() + 7) // 7 days after period ends

    const { error } = await supabase.from('uc_reporting_periods').insert({
      user_id: user.id,
      period_start: periodStart.toISOString().split('T')[0],
      period_end: periodEnd.toISOString().split('T')[0],
      submission_due: submissionDue.toISOString().split('T')[0],
      status: 'draft',
    })

    if (!error) created++
  }

  revalidatePath('/business/universal-credit')
  return { created, error: null }
}

export async function updateUCPeriodStatus(periodId: string, status: UCPeriodStatus): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'submitted') updates.submitted_at = new Date().toISOString()
  if (status === 'locked') updates.locked_at = new Date().toISOString()

  const { error } = await supabase
    .from('uc_reporting_periods')
    .update(updates)
    .eq('id', periodId)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to update status.' }

  await logAudit(supabase, user.id, periodId, 'status_change', 'period', periodId, { status })
  revalidatePath('/business/universal-credit')
  return { error: null }
}

// ─── Income Entries ──────────────────────────────────────────────────────────

export async function getUCIncome(periodId: string): Promise<{ data: UCIncomeEntry[]; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('uc_income_entries')
    .select('*')
    .eq('period_id', periodId)
    .eq('user_id', user.id)
    .order('date_received', { ascending: true })

  if (error) return { data: [], error: 'Failed to fetch income.' }
  return { data: (data ?? []) as UCIncomeEntry[], error: null }
}

export async function addUCIncome(formData: FormData): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const periodId = formData.get('period_id') as string
  const amount = parseFloat(formData.get('amount') as string)
  const dateReceived = formData.get('date_received') as string
  const source = formData.get('source') as string
  const paymentMethod = (formData.get('payment_method') as string) || null
  const linkedInvoiceId = (formData.get('linked_invoice_id') as string) || null
  const notes = (formData.get('notes') as string) || null

  if (!periodId || isNaN(amount) || !dateReceived || !source) {
    return { error: 'Amount, date, and source are required.' }
  }

  const { error } = await supabase.from('uc_income_entries').insert({
    user_id: user.id,
    period_id: periodId,
    amount,
    date_received: dateReceived,
    source,
    payment_method: paymentMethod,
    linked_invoice_id: linkedInvoiceId || null,
    notes,
  })

  if (error) return { error: 'Failed to add income entry.' }

  await logAudit(supabase, user.id, periodId, 'create', 'income', null, { amount, source })
  revalidatePath('/business/universal-credit')
  return { error: null }
}

export async function deleteUCIncome(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('uc_income_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to delete.' }
  revalidatePath('/business/universal-credit')
  return { error: null }
}

// ─── Expense Entries ─────────────────────────────────────────────────────────

export async function getUCExpenses(periodId: string): Promise<{ data: UCExpenseEntry[]; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('uc_expense_entries')
    .select('*')
    .eq('period_id', periodId)
    .eq('user_id', user.id)
    .order('date_incurred', { ascending: true })

  if (error) return { data: [], error: 'Failed to fetch expenses.' }
  return { data: (data ?? []) as UCExpenseEntry[], error: null }
}

export async function addUCExpense(formData: FormData): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const periodId = formData.get('period_id') as string
  const amount = parseFloat(formData.get('amount') as string)
  const dateIncurred = formData.get('date_incurred') as string
  const category = formData.get('category') as string
  const description = formData.get('description') as string
  const supplier = (formData.get('supplier') as string) || null
  const notes = (formData.get('notes') as string) || null

  if (!periodId || isNaN(amount) || !dateIncurred || !category || !description) {
    return { error: 'Amount, date, category, and description are required.' }
  }

  const { error } = await supabase.from('uc_expense_entries').insert({
    user_id: user.id,
    period_id: periodId,
    amount,
    date_incurred: dateIncurred,
    category,
    description,
    supplier,
    notes,
  })

  if (error) return { error: 'Failed to add expense.' }

  await logAudit(supabase, user.id, periodId, 'create', 'expense', null, { amount, category })
  revalidatePath('/business/universal-credit')
  return { error: null }
}

export async function deleteUCExpense(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('uc_expense_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to delete.' }
  revalidatePath('/business/universal-credit')
  return { error: null }
}

// ─── Evidence ────────────────────────────────────────────────────────────────

export async function getUCEvidence(periodId: string): Promise<{ data: UCEvidenceFile[]; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('uc_evidence_files')
    .select('*')
    .eq('user_id', user.id)
    .or(`period_id.eq.${periodId},income_entry_id.not.is.null,expense_entry_id.not.is.null`)
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: 'Failed to fetch evidence.' }
  return { data: (data ?? []) as UCEvidenceFile[], error: null }
}

// ─── Period Summary ──────────────────────────────────────────────────────────

export async function getUCPeriodSummary(periodId: string): Promise<{ data: UCPeriodSummary | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  // Fetch period
  const { data: period } = await supabase
    .from('uc_reporting_periods')
    .select('*')
    .eq('id', periodId)
    .eq('user_id', user.id)
    .single()

  if (!period) return { data: null, error: 'Period not found.' }

  // Fetch income and expenses
  const [{ data: income }, { data: expenses }, { data: evidence }] = await Promise.all([
    getUCIncome(periodId),
    getUCExpenses(periodId),
    getUCEvidence(periodId),
  ])

  const incomeEntries = income ?? []
  const expenseEntries = expenses ?? []
  const evidenceFiles = evidence ?? []

  const totalIncome = incomeEntries.reduce((s, i) => s + i.amount, 0)
  const totalExpenses = expenseEntries.reduce((s, e) => s + e.amount, 0)
  const estimatedProfit = totalIncome - totalExpenses

  // Check evidence coverage
  const missingEvidence: MissingEvidenceItem[] = []

  for (const inc of incomeEntries) {
    const hasEvidence = evidenceFiles.some((e) => e.income_entry_id === inc.id)
    if (!hasEvidence && !inc.linked_invoice_id) {
      missingEvidence.push({
        type: 'income',
        id: inc.id,
        description: `${inc.source} — £${inc.amount.toFixed(2)} on ${inc.date_received}`,
        amount: inc.amount,
      })
    }
  }

  for (const exp of expenseEntries) {
    const hasEvidence = evidenceFiles.some((e) => e.expense_entry_id === exp.id)
    if (!hasEvidence && !exp.linked_expense_id) {
      missingEvidence.push({
        type: 'expense',
        id: exp.id,
        description: `${exp.description} — £${exp.amount.toFixed(2)} on ${exp.date_incurred}`,
        amount: exp.amount,
      })
    }
  }

  const totalEntries = incomeEntries.length + expenseEntries.length
  const entriesWithEvidence = totalEntries - missingEvidence.length
  const evidenceCompletionPercent = totalEntries > 0
    ? Math.round((entriesWithEvidence / totalEntries) * 100)
    : 100

  // Warnings
  const warnings: string[] = []
  if (missingEvidence.length > 0) {
    warnings.push(`${missingEvidence.length} entries missing evidence`)
  }

  // Check for duplicates
  const expenseAmounts = expenseEntries.map((e) => `${e.amount}-${e.date_incurred}-${e.category}`)
  const duplicates = expenseAmounts.filter((v, i, a) => a.indexOf(v) !== i)
  if (duplicates.length > 0) {
    warnings.push(`${duplicates.length} possible duplicate expense(s) detected`)
  }

  // Check for unusual amounts (> 3x average)
  if (expenseEntries.length > 3) {
    const avg = totalExpenses / expenseEntries.length
    const unusual = expenseEntries.filter((e) => e.amount > avg * 3)
    if (unusual.length > 0) {
      warnings.push(`${unusual.length} expense(s) unusually high compared to average`)
    }
  }

  return {
    data: {
      period: period as UCReportingPeriod,
      totalIncome,
      totalExpenses,
      estimatedProfit,
      incomeEntries,
      expenseEntries,
      evidenceCompletionPercent,
      missingEvidence,
      warnings,
    },
    error: null,
  }
}

// ─── Import from existing data ───────────────────────────────────────────────

/**
 * Pull paid invoices from the period into UC income entries.
 */
export async function importInvoicesToUC(periodId: string): Promise<{ imported: number; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { imported: 0, error: 'Not authenticated' }

  // Get period dates
  const { data: period } = await supabase
    .from('uc_reporting_periods')
    .select('period_start, period_end')
    .eq('id', periodId)
    .eq('user_id', user.id)
    .single()

  if (!period) return { imported: 0, error: 'Period not found.' }

  // Get paid invoices in this period (by payment date)
  const { data: payments } = await supabase
    .from('payments')
    .select('amount, payment_date, payment_method, invoice_id, invoices(invoice_number, customer_id, customers(name))')
    .eq('user_id', user.id)
    .gte('payment_date', period.period_start)
    .lte('payment_date', period.period_end)

  if (!payments || payments.length === 0) return { imported: 0, error: null }

  // Get existing UC income to avoid duplicates
  const { data: existing } = await supabase
    .from('uc_income_entries')
    .select('linked_invoice_id')
    .eq('period_id', periodId)
    .eq('user_id', user.id)

  const existingInvoiceIds = new Set((existing ?? []).map((e) => e.linked_invoice_id).filter(Boolean))

  let imported = 0
  for (const payment of payments) {
    if (payment.invoice_id && existingInvoiceIds.has(payment.invoice_id)) continue

    const invoice = payment.invoices as unknown as { invoice_number: string; customers: { name: string } | null }
    const source = invoice?.customers?.name
      ? `${invoice.customers.name} (Invoice ${invoice.invoice_number})`
      : `Invoice ${invoice?.invoice_number ?? 'Unknown'}`

    const { error } = await supabase.from('uc_income_entries').insert({
      user_id: user.id,
      period_id: periodId,
      amount: payment.amount,
      date_received: payment.payment_date,
      source,
      payment_method: payment.payment_method,
      linked_invoice_id: payment.invoice_id,
    })

    if (!error) imported++
  }

  revalidatePath('/business/universal-credit')
  return { imported, error: null }
}

/**
 * Pull expenses from the period into UC expense entries.
 */
export async function importExpensesToUC(periodId: string): Promise<{ imported: number; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { imported: 0, error: 'Not authenticated' }

  const { data: period } = await supabase
    .from('uc_reporting_periods')
    .select('period_start, period_end')
    .eq('id', periodId)
    .eq('user_id', user.id)
    .single()

  if (!period) return { imported: 0, error: 'Period not found.' }

  // Get expenses in this period
  const { data: expenses } = await supabase
    .from('purchases')
    .select('id, purchase_date, description, category, cost, supplier_id, suppliers(name)')
    .eq('user_id', user.id)
    .gte('purchase_date', period.period_start)
    .lte('purchase_date', period.period_end)

  if (!expenses || expenses.length === 0) return { imported: 0, error: null }

  // Get existing to avoid duplicates
  const { data: existing } = await supabase
    .from('uc_expense_entries')
    .select('linked_expense_id')
    .eq('period_id', periodId)
    .eq('user_id', user.id)

  const existingIds = new Set((existing ?? []).map((e) => e.linked_expense_id).filter(Boolean))

  // Map business categories to UC categories
  const categoryMap: Record<string, string> = {
    cost_of_goods: 'materials',
    stock: 'materials',
    travel: 'mileage_travel',
    staff_costs: 'other_allowable',
    premises: 'office_costs',
    repairs: 'equipment',
    professional_fees: 'professional_fees',
    finance_charges: 'other_allowable',
    office_costs: 'office_costs',
    office_supplies: 'office_costs',
    equipment: 'equipment',
    subscription: 'phone_internet',
    books: 'other_allowable',
    other_expenses: 'other_allowable',
  }

  let imported = 0
  for (const expense of expenses) {
    if (existingIds.has(expense.id)) continue

    const supplier = expense.suppliers as unknown as { name: string } | null
    const ucCategory = categoryMap[expense.category] ?? 'other_allowable'

    const { error } = await supabase.from('uc_expense_entries').insert({
      user_id: user.id,
      period_id: periodId,
      amount: expense.cost,
      date_incurred: expense.purchase_date,
      category: ucCategory,
      description: expense.description,
      supplier: supplier?.name ?? null,
      linked_expense_id: expense.id,
    })

    if (!error) imported++
  }

  revalidatePath('/business/universal-credit')
  return { imported, error: null }
}

// ─── Audit helper ────────────────────────────────────────────────────────────

async function logAudit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  periodId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  details: Record<string, unknown> | null
) {
  await supabase.from('uc_audit_log').insert({
    user_id: userId,
    period_id: periodId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  })
}
