'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { quoteFormSchema } from '@/lib/validators/quote'
import { assertProPlusTier } from './business-gate'
import type {
  QuoteRow,
  QuoteWithDetails,
  QuoteActionState,
  QuoteFilters,
  InvoiceActionState,
} from '@/types/invoicing'

/**
 * Get the next sequential quote number for the current user.
 * Format: QTE-001, QTE-002, etc.
 */
export async function getNextQuoteNumber(): Promise<string> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return 'QTE-001'
  }

  const { data } = await supabase
    .from('quotes')
    .select('quote_number')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  if (!data || data.length === 0) {
    return 'QTE-001'
  }

  const lastNum = parseInt(data[0].quote_number.replace('QTE-', ''), 10)
  return `QTE-${String(lastNum + 1).padStart(3, '0')}`
}

/**
 * Create a new quote with line items.
 * Parses items from FormData arrays (description[], quantity[], unit_price[]).
 */
export async function createQuote(
  _prevState: QuoteActionState | null,
  formData: FormData
): Promise<QuoteActionState> {
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
    items,
  }

  const result = quoteFormSchema.safeParse(rawData)

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

  // Get next quote number
  const quoteNumber = await getNextQuoteNumber()

  // Insert quote
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .insert({
      user_id: user.id,
      customer_id: validated.customer_id,
      quote_number: quoteNumber,
      issue_date: validated.issue_date,
      total: total,
      status: 'draft',
    })
    .select()
    .single()

  if (quoteError || !quote) {
    return { success: false, error: 'Failed to create quote. Please try again.' }
  }

  // Insert line items
  const itemsToInsert = validated.items.map((item, index) => ({
    quote_id: quote.id,
    user_id: user.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    sort_order: index,
  }))

  const { error: itemsError } = await supabase
    .from('quote_items')
    .insert(itemsToInsert)

  if (itemsError) {
    // Clean up the quote if items failed
    await supabase.from('quotes').delete().eq('id', quote.id)
    return { success: false, error: 'Failed to create quote items. Please try again.' }
  }

  revalidatePath('/business/invoicing/quotes')
  return { success: true, error: null, data: quote as QuoteRow }
}

/**
 * Update an existing quote. Only allowed if status is draft.
 */
export async function updateQuote(
  id: string,
  _prevState: QuoteActionState | null,
  formData: FormData
): Promise<QuoteActionState> {
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

  // Fetch existing quote to check status
  const { data: existing, error: fetchError } = await supabase
    .from('quotes')
    .select('id, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !existing) {
    return { success: false, error: 'Quote not found.' }
  }

  if (existing.status !== 'draft') {
    return { success: false, error: 'Only draft quotes can be edited.' }
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
    items,
  }

  const result = quoteFormSchema.safeParse(rawData)

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

  // Update quote
  const { data: quote, error: updateError } = await supabase
    .from('quotes')
    .update({
      customer_id: validated.customer_id,
      issue_date: validated.issue_date,
      total: total,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (updateError || !quote) {
    return { success: false, error: 'Failed to update quote. Please try again.' }
  }

  // Delete old items and insert new ones
  await supabase.from('quote_items').delete().eq('quote_id', id)

  const itemsToInsert = validated.items.map((item, index) => ({
    quote_id: id,
    user_id: user.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    sort_order: index,
  }))

  const { error: itemsError } = await supabase
    .from('quote_items')
    .insert(itemsToInsert)

  if (itemsError) {
    return { success: false, error: 'Failed to update quote items. Please try again.' }
  }

  revalidatePath('/business/invoicing/quotes')
  revalidatePath(`/business/invoicing/quotes/${id}`)
  return { success: true, error: null, data: quote as QuoteRow }
}

/**
 * Delete a quote. Only allowed if status is draft.
 */
export async function deleteQuote(id: string): Promise<QuoteActionState> {
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

  // Fetch existing quote to check status
  const { data: existing, error: fetchError } = await supabase
    .from('quotes')
    .select('id, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !existing) {
    return { success: false, error: 'Quote not found.' }
  }

  if (existing.status !== 'draft') {
    return { success: false, error: 'Only draft quotes can be deleted.' }
  }

  // Delete (cascade handles items)
  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: 'Failed to delete quote. Please try again.' }
  }

  revalidatePath('/business/invoicing/quotes')
  return { success: true, error: null }
}

/**
 * Fetch quotes for the current user with optional filters.
 * Joins customer name for display.
 */
export async function getQuotes(filters?: QuoteFilters): Promise<{
  data: (QuoteRow & { customer: { name: string } })[] | null
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
    .from('quotes')
    .select('*, customer:customers(name)')
    .eq('user_id', user.id)

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.customer_id) {
    query = query.eq('customer_id', filters.customer_id)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    return { data: null, error: 'Failed to fetch quotes.' }
  }

  return { data: data as (QuoteRow & { customer: { name: string } })[], error: null }
}

/**
 * Fetch a single quote with all details: items, customer, email_logs.
 */
export async function getQuote(id: string): Promise<{
  data: QuoteWithDetails | null
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

  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('*, customer:customers(id, name, email, address)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (quoteError || !quote) {
    return { data: null, error: 'Quote not found.' }
  }

  // Fetch items
  const { data: items } = await supabase
    .from('quote_items')
    .select('*')
    .eq('quote_id', id)
    .order('sort_order', { ascending: true })

  // Fetch email logs
  const { data: emailLogs } = await supabase
    .from('email_logs')
    .select('*')
    .eq('document_type', 'quote')
    .eq('document_id', id)
    .order('sent_at', { ascending: false })

  const result: QuoteWithDetails = {
    ...quote,
    items: items || [],
    customer: quote.customer,
    email_logs: emailLogs || [],
  }

  return { data: result, error: null }
}

/**
 * Convert a quote to an invoice.
 * Only allowed if quote status is draft or sent.
 * Creates an invoice with the same customer and line items, sets quote status to "accepted".
 */
export async function convertQuoteToInvoice(
  quoteId: string,
  dueDate: string
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

  // Fetch the quote with items
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', quoteId)
    .eq('user_id', user.id)
    .single()

  if (quoteError || !quote) {
    return { success: false, error: 'Quote not found.' }
  }

  if (quote.status !== 'draft' && quote.status !== 'sent') {
    return { success: false, error: 'Only draft or sent quotes can be converted to invoices.' }
  }

  // Fetch quote items
  const { data: quoteItems } = await supabase
    .from('quote_items')
    .select('*')
    .eq('quote_id', quoteId)
    .order('sort_order', { ascending: true })

  if (!quoteItems || quoteItems.length === 0) {
    return { success: false, error: 'Quote has no items to convert.' }
  }

  // Get next invoice number
  const { data: lastInvoice } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  let invoiceNumber = 'INV-001'
  if (lastInvoice && lastInvoice.length > 0) {
    const lastNum = parseInt(lastInvoice[0].invoice_number.replace('INV-', ''), 10)
    invoiceNumber = `INV-${String(lastNum + 1).padStart(3, '0')}`
  }

  // Create invoice from quote data
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      user_id: user.id,
      customer_id: quote.customer_id,
      project_id: null,
      invoice_number: invoiceNumber,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: dueDate,
      total: quote.total,
      amount_paid: 0,
      status: 'draft',
      deposit_percent: 40,
      stage2_percent: 40,
      final_percent: 20,
      quote_id: quoteId,
    })
    .select()
    .single()

  if (invoiceError || !invoice) {
    return { success: false, error: 'Failed to create invoice from quote. Please try again.' }
  }

  // Insert invoice items from quote items
  const invoiceItems = quoteItems.map((item, index) => ({
    invoice_id: invoice.id,
    user_id: user.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    sort_order: index,
  }))

  const { error: itemsError } = await supabase
    .from('invoice_items')
    .insert(invoiceItems)

  if (itemsError) {
    // Clean up the invoice if items failed
    await supabase.from('invoices').delete().eq('id', invoice.id)
    return { success: false, error: 'Failed to create invoice items. Please try again.' }
  }

  // Update quote status to "accepted"
  await supabase
    .from('quotes')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', quoteId)
    .eq('user_id', user.id)

  revalidatePath('/business/invoicing/quotes')
  revalidatePath('/business/invoicing/invoices')
  revalidatePath(`/business/invoicing/quotes/${quoteId}`)

  return { success: true, error: null, data: invoice }
}
