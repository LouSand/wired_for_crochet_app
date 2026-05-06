'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { purchaseFormSchema } from '@/lib/validators/expense'
import { assertProTier } from './business-gate'
import type { PurchaseRow, ExpenseFilters } from '@/types/business'

export type ExpenseActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
} | null

/**
 * Create a new expense/purchase for the authenticated user.
 * Validates with purchaseFormSchema and checks Pro tier.
 */
export async function createExpense(
  _prevState: ExpenseActionState,
  formData: FormData
): Promise<ExpenseActionState> {
  const tierCheck = await assertProTier()
  if (tierCheck) {
    return { error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to add an expense.' }
  }

  const rawData = {
    purchase_date: (formData.get('purchase_date') as string) || '',
    description: (formData.get('description') as string) || '',
    category: (formData.get('category') as string) || '',
    cost: parseFloat((formData.get('cost') as string) || '0'),
    supplier_id: (formData.get('supplier_id') as string) || '',
    invoice_path: (formData.get('invoice_path') as string) || '',
    invoice_file_name: (formData.get('invoice_file_name') as string) || '',
  }

  const result = purchaseFormSchema.safeParse(rawData)

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of result.error.issues) {
      const field = issue.path.join('.')
      if (!fieldErrors[field]) {
        fieldErrors[field] = []
      }
      fieldErrors[field].push(issue.message)
    }
    return { fieldErrors }
  }

  const validated = result.data

  const { error } = await supabase.from('purchases').insert({
    user_id: user.id,
    purchase_date: validated.purchase_date,
    description: validated.description,
    category: validated.category,
    cost: validated.cost,
    supplier_id: validated.supplier_id || null,
    invoice_path: validated.invoice_path || null,
    invoice_file_name: validated.invoice_file_name || null,
  })

  if (error) {
    return { error: 'Failed to create expense. Please try again.' }
  }

  revalidatePath('/business/expenses')
  return null
}

/**
 * Update an existing expense/purchase.
 * Validates, checks ownership, and updates.
 */
export async function updateExpense(
  id: string,
  _prevState: ExpenseActionState,
  formData: FormData
): Promise<ExpenseActionState> {
  const tierCheck = await assertProTier()
  if (tierCheck) {
    return { error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to update an expense.' }
  }

  // Check ownership
  const { data: existing, error: fetchError } = await supabase
    .from('purchases')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !existing) {
    return { error: 'Expense not found.' }
  }

  const rawData = {
    purchase_date: (formData.get('purchase_date') as string) || '',
    description: (formData.get('description') as string) || '',
    category: (formData.get('category') as string) || '',
    cost: parseFloat((formData.get('cost') as string) || '0'),
    supplier_id: (formData.get('supplier_id') as string) || '',
    invoice_path: (formData.get('invoice_path') as string) || '',
    invoice_file_name: (formData.get('invoice_file_name') as string) || '',
  }

  const result = purchaseFormSchema.safeParse(rawData)

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of result.error.issues) {
      const field = issue.path.join('.')
      if (!fieldErrors[field]) {
        fieldErrors[field] = []
      }
      fieldErrors[field].push(issue.message)
    }
    return { fieldErrors }
  }

  const validated = result.data

  const { error } = await supabase
    .from('purchases')
    .update({
      purchase_date: validated.purchase_date,
      description: validated.description,
      category: validated.category,
      cost: validated.cost,
      supplier_id: validated.supplier_id || null,
      invoice_path: validated.invoice_path || null,
      invoice_file_name: validated.invoice_file_name || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to update expense. Please try again.' }
  }

  revalidatePath('/business/expenses')
  return null
}

/**
 * Delete an expense/purchase and remove associated invoice file from storage.
 */
export async function deleteExpense(id: string): Promise<ExpenseActionState> {
  const tierCheck = await assertProTier()
  if (tierCheck) {
    return { error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to delete an expense.' }
  }

  // Fetch the expense to check for invoice file
  const { data: expense, error: fetchError } = await supabase
    .from('purchases')
    .select('id, invoice_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !expense) {
    return { error: 'Expense not found.' }
  }

  // Remove invoice file from storage if it exists
  if (expense.invoice_path) {
    await supabase.storage.from('invoices').remove([expense.invoice_path])
  }

  const { error } = await supabase
    .from('purchases')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to delete expense. Please try again.' }
  }

  revalidatePath('/business/expenses')
  return null
}

/**
 * Fetch all expenses/purchases for the authenticated user with optional filters.
 */
export async function getExpenses(filters?: ExpenseFilters): Promise<{
  data: PurchaseRow[] | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to view expenses.' }
  }

  let query = supabase
    .from('purchases')
    .select('*')
    .eq('user_id', user.id)

  if (filters?.category) {
    query = query.eq('category', filters.category)
  }

  if (filters?.supplier_id) {
    query = query.eq('supplier_id', filters.supplier_id)
  }

  if (filters?.start_date) {
    query = query.gte('purchase_date', filters.start_date)
  }

  if (filters?.end_date) {
    query = query.lte('purchase_date', filters.end_date)
  }

  query = query.order('purchase_date', { ascending: false })

  const { data, error } = await query

  if (error) {
    return { data: null, error: 'Failed to fetch expenses.' }
  }

  return { data: data as PurchaseRow[], error: null }
}
