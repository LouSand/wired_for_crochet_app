'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { invoiceFormSchema } from '@/lib/validators/invoice'
import { assertProPlusTier } from './business-gate'
import type {
  InvoiceRow,
  InvoiceWithDetails,
  InvoiceActionState,
  InvoiceFilters,
} from '@/types/invoicing'

/**
 * Get the next sequential invoice number for the current user.
 * Format: INV-001, INV-002, etc.
 */
export async function getNextInvoiceNumber(): Promise<string> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return 'INV-001'
  }

  const { data } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  if (!data || data.length === 0) {
    return 'INV-001'
  }

  const lastNum = parseInt(data[0].invoice_number.replace('INV-', ''), 10)
  return `INV-${String(lastNum + 1).padStart(3, '0')}`
}

/**
 * Create a new invoice with line items.
 * Parses items from FormData arrays (description[], quantity[], unit_price[]).
 */
export async function createInvoice(
  _prevState: InvoiceActionState | null,
  formData: FormData
): Promise<InvoiceActionState> {
  const tierCheck = await assertProPlusTier()
  if (tierCheck) {
    return { success: false, error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'You must be logged in.' }
  }

  // Parse line items from FormData arrays
  const descriptions = formData.getAll('description[]') as string[]
  const quantities = formData.getAll('quantity[]') as string[]
  const unitPrices = formData.getAll('unit_price[]') as string[]

  const items = descriptions.map((desc, i) => ({
    description: desc,
    quantity: parseInt(quantities[i] || '0', 10),
    unit_price: parseFloat(unitPrices[i] || '0'),
  }))

  const rawData = {
    customer_id: (formData.get('customer_id') as string) || '',
    issue_date: (formData.get('issue_date') as string) || '',
    due_date: (formData.get('due_date') as string) || '',
    deposit_percent: parseInt((formData.get('deposit_percent') as string) || '40', 10),
    stage2_percent: parseInt((formData.get('stage2_percent') as string) || '40', 10),
    final_percent: parseInt((formData.get('final_percent') as string) || '20', 10),
    project_id: (formData.get('project_id') as string) || null,
    items,
  }

  const result = invoiceFormSchema.safeParse(rawData)

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of result.error.issues) {
      const field = issue.path.join('.')
      if (!fieldErrors[field]) {
        fieldErrors[field] = []
      }
      fieldErrors[field].push(issue.message)
    }
    return { success: false, error: 'Validation failed.', fieldErrors }
  }

  const validated = result.data

  // Calculate total from items
  const total = validated.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  )

  // Get next invoice number
  const invoiceNumber = await getNextInvoiceNumber()

  // Insert invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      user_id: user.id,
      customer_id: validated.customer_id,
      project_id: validated.project_id || null,
      invoice_number: invoiceNumber,
      issue_date: validated.issue_date,
      due_date: validated.due_date,
      total: total,
      amount_paid: 0,
      status: 'draft',
      deposit_percent: validated.deposit_percent,
      stage2_percent: validated.stage2_percent,
      final_percent: validated.final_percent,
    })
    .select()
    .single()

  if (invoiceError || !invoice) {
    return { success: false, error: 'Failed to create invoice. Please try again.' }
  }

  // Insert line items
  const itemsToInsert = validated.items.map((item, index) => ({
    invoice_id: invoice.id,
    user_id: user.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    sort_order: index,
  }))

  const { error: itemsError } = await supabase
    .from('invoice_items')
    .insert(itemsToInsert)

  if (itemsError) {
    // Clean up the invoice if items failed
    await supabase.from('invoices').delete().eq('id', invoice.id)
    return { success: false, error: 'Failed to create invoice items. Please try again.' }
  }

  revalidatePath('/business/invoicing/invoices')
  return { success: true, error: null, data: invoice as InvoiceRow }
}

/**
 * Update an existing invoice. Only allowed if status is draft or unpaid.
 */
export async function updateInvoice(
  id: string,
  _prevState: InvoiceActionState | null,
  formData: FormData
): Promise<InvoiceActionState> {
  const tierCheck = await assertProPlusTier()
  if (tierCheck) {
    return { success: false, error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'You must be logged in.' }
  }

  // Fetch existing invoice to check status
  const { data: existing, error: fetchError } = await supabase
    .from('invoices')
    .select('id, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !existing) {
    return { success: false, error: 'Invoice not found.' }
  }

  if (existing.status !== 'draft' && existing.status !== 'unpaid') {
    return { success: false, error: 'Only draft or unpaid invoices can be edited.' }
  }

  // Parse line items from FormData arrays
  const descriptions = formData.getAll('description[]') as string[]
  const quantities = formData.getAll('quantity[]') as string[]
  const unitPrices = formData.getAll('unit_price[]') as string[]

  const items = descriptions.map((desc, i) => ({
    description: desc,
    quantity: parseInt(quantities[i] || '0', 10),
    unit_price: parseFloat(unitPrices[i] || '0'),
  }))

  const rawData = {
    customer_id: (formData.get('customer_id') as string) || '',
    issue_date: (formData.get('issue_date') as string) || '',
    due_date: (formData.get('due_date') as string) || '',
    deposit_percent: parseInt((formData.get('deposit_percent') as string) || '40', 10),
    stage2_percent: parseInt((formData.get('stage2_percent') as string) || '40', 10),
    final_percent: parseInt((formData.get('final_percent') as string) || '20', 10),
    project_id: (formData.get('project_id') as string) || null,
    items,
  }

  const result = invoiceFormSchema.safeParse(rawData)

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of result.error.issues) {
      const field = issue.path.join('.')
      if (!fieldErrors[field]) {
        fieldErrors[field] = []
      }
      fieldErrors[field].push(issue.message)
    }
    return { success: false, error: 'Validation failed.', fieldErrors }
  }

  const validated = result.data

  // Calculate total from items
  const total = validated.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  )

  // Update invoice
  const { data: invoice, error: updateError } = await supabase
    .from('invoices')
    .update({
      customer_id: validated.customer_id,
      project_id: validated.project_id || null,
      issue_date: validated.issue_date,
      due_date: validated.due_date,
      total: total,
      deposit_percent: validated.deposit_percent,
      stage2_percent: validated.stage2_percent,
      final_percent: validated.final_percent,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (updateError || !invoice) {
    return { success: false, error: 'Failed to update invoice. Please try again.' }
  }

  // Delete old items and insert new ones
  await supabase.from('invoice_items').delete().eq('invoice_id', id)

  const itemsToInsert = validated.items.map((item, index) => ({
    invoice_id: id,
    user_id: user.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    sort_order: index,
  }))

  const { error: itemsError } = await supabase
    .from('invoice_items')
    .insert(itemsToInsert)

  if (itemsError) {
    return { success: false, error: 'Failed to update invoice items. Please try again.' }
  }

  revalidatePath('/business/invoicing/invoices')
  revalidatePath(`/business/invoicing/invoices/${id}`)
  return { success: true, error: null, data: invoice as InvoiceRow }
}

/**
 * Delete an invoice. Only allowed if status is draft.
 */
export async function deleteInvoice(id: string): Promise<InvoiceActionState> {
  const tierCheck = await assertProPlusTier()
  if (tierCheck) {
    return { success: false, error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'You must be logged in.' }
  }

  // Fetch existing invoice to check status
  const { data: existing, error: fetchError } = await supabase
    .from('invoices')
    .select('id, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !existing) {
    return { success: false, error: 'Invoice not found.' }
  }

  if (existing.status !== 'draft') {
    return { success: false, error: 'Only draft invoices can be deleted.' }
  }

  // Delete (cascade handles items)
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: 'Failed to delete invoice. Please try again.' }
  }

  revalidatePath('/business/invoicing/invoices')
  return { success: true, error: null }
}

/**
 * Fetch invoices for the current user with optional filters.
 * Joins customer name for display.
 */
export async function getInvoices(filters?: InvoiceFilters): Promise<{
  data: (InvoiceRow & { customer: { name: string } })[] | null
  error: string | null
}> {
  const tierCheck = await assertProPlusTier()
  if (tierCheck) {
    return { data: null, error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in.' }
  }

  let query = supabase
    .from('invoices')
    .select('*, customer:customers(name)')
    .eq('user_id', user.id)

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.customer_id) {
    query = query.eq('customer_id', filters.customer_id)
  }

  if (filters?.overdue_only) {
    query = query
      .lt('due_date', new Date().toISOString().split('T')[0])
      .in('status', ['unpaid', 'partial'])
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    return { data: null, error: 'Failed to fetch invoices.' }
  }

  return { data: data as (InvoiceRow & { customer: { name: string } })[], error: null }
}

/**
 * Fetch a single invoice with all details: items, payments, customer, email_logs.
 */
export async function getInvoice(id: string): Promise<{
  data: InvoiceWithDetails | null
  error: string | null
}> {
  const tierCheck = await assertProPlusTier()
  if (tierCheck) {
    return { data: null, error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in.' }
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*, customer:customers(id, name, email, address)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (invoiceError || !invoice) {
    return { data: null, error: 'Invoice not found.' }
  }

  // Fetch items
  const { data: items } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', id)
    .order('sort_order', { ascending: true })

  // Fetch payments
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('invoice_id', id)
    .order('payment_date', { ascending: false })

  // Fetch email logs
  const { data: emailLogs } = await supabase
    .from('email_logs')
    .select('*')
    .eq('document_type', 'invoice')
    .eq('document_id', id)
    .order('sent_at', { ascending: false })

  const result: InvoiceWithDetails = {
    ...invoice,
    items: items || [],
    payments: payments || [],
    customer: invoice.customer,
    email_logs: emailLogs || [],
  }

  return { data: result, error: null }
}
