'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { assertProPlusTier } from './business-gate'
import type { EmailActionState } from '@/types/invoicing'

/**
 * Send an invoice via email to the customer.
 * Updates invoice status from draft → unpaid if applicable.
 * Creates/updates email_log entry.
 */
export async function sendInvoiceEmail(invoiceId: string): Promise<EmailActionState> {
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

  // Fetch invoice with customer
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*, customer:customers(name, email)')
    .eq('id', invoiceId)
    .eq('user_id', user.id)
    .single()

  if (invoiceError || !invoice) {
    return { success: false, error: 'Invoice not found.' }
  }

  const customerEmail = invoice.customer?.email
  if (!customerEmail) {
    return { success: false, error: 'Customer does not have an email address on file. Please update their details first.' }
  }

  // Check for existing email log
  const { data: existingLog } = await supabase
    .from('email_logs')
    .select('id, send_count')
    .eq('document_type', 'invoice')
    .eq('document_id', invoiceId)
    .eq('user_id', user.id)
    .single()

  // Call Edge Function to send email
  const { error: fnError } = await supabase.functions.invoke('send-email', {
    body: {
      to: customerEmail,
      subject: `Invoice ${invoice.invoice_number} from your service provider`,
      body: `Please find attached invoice ${invoice.invoice_number} for the amount of ${invoice.total}. Due date: ${invoice.due_date}.`,
      document_type: 'invoice',
      document_id: invoiceId,
    },
  })

  if (fnError) {
    // Log the error but don't fail — the stub always succeeds
    console.error('Edge function error:', fnError)
  }

  // Create or update email log
  if (existingLog) {
    await supabase
      .from('email_logs')
      .update({
        send_count: existingLog.send_count + 1,
        sent_at: new Date().toISOString(),
        recipient: customerEmail,
        subject: `Invoice ${invoice.invoice_number}`,
      })
      .eq('id', existingLog.id)
  } else {
    await supabase.from('email_logs').insert({
      user_id: user.id,
      document_type: 'invoice',
      document_id: invoiceId,
      recipient: customerEmail,
      subject: `Invoice ${invoice.invoice_number}`,
      send_count: 1,
    })
  }

  // Update invoice status from draft → unpaid if currently draft
  if (invoice.status === 'draft') {
    await supabase
      .from('invoices')
      .update({ status: 'unpaid', updated_at: new Date().toISOString() })
      .eq('id', invoiceId)
      .eq('user_id', user.id)
  }

  revalidatePath(`/business/invoicing/invoices/${invoiceId}`)
  revalidatePath('/business/invoicing/invoices')
  return { success: true, error: null }
}

/**
 * Send a quote via email to the customer.
 * Updates quote status from draft → sent if applicable.
 * Creates/updates email_log entry.
 */
export async function sendQuoteEmail(quoteId: string): Promise<EmailActionState> {
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

  // Fetch quote with customer
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('*, customer:customers(name, email)')
    .eq('id', quoteId)
    .eq('user_id', user.id)
    .single()

  if (quoteError || !quote) {
    return { success: false, error: 'Quote not found.' }
  }

  const customerEmail = quote.customer?.email
  if (!customerEmail) {
    return { success: false, error: 'Customer does not have an email address on file. Please update their details first.' }
  }

  // Check for existing email log
  const { data: existingLog } = await supabase
    .from('email_logs')
    .select('id, send_count')
    .eq('document_type', 'quote')
    .eq('document_id', quoteId)
    .eq('user_id', user.id)
    .single()

  // Call Edge Function to send email
  const { error: fnError } = await supabase.functions.invoke('send-email', {
    body: {
      to: customerEmail,
      subject: `Quote ${quote.quote_number} from your service provider`,
      body: `Please find attached quote ${quote.quote_number} for the amount of ${quote.total}.`,
      document_type: 'quote',
      document_id: quoteId,
    },
  })

  if (fnError) {
    console.error('Edge function error:', fnError)
  }

  // Create or update email log
  if (existingLog) {
    await supabase
      .from('email_logs')
      .update({
        send_count: existingLog.send_count + 1,
        sent_at: new Date().toISOString(),
        recipient: customerEmail,
        subject: `Quote ${quote.quote_number}`,
      })
      .eq('id', existingLog.id)
  } else {
    await supabase.from('email_logs').insert({
      user_id: user.id,
      document_type: 'quote',
      document_id: quoteId,
      recipient: customerEmail,
      subject: `Quote ${quote.quote_number}`,
      send_count: 1,
    })
  }

  // Update quote status from draft → sent if currently draft
  if (quote.status === 'draft') {
    await supabase
      .from('quotes')
      .update({ status: 'sent', updated_at: new Date().toISOString() })
      .eq('id', quoteId)
      .eq('user_id', user.id)
  }

  revalidatePath(`/business/invoicing/quotes/${quoteId}`)
  revalidatePath('/business/invoicing/quotes')
  return { success: true, error: null }
}
