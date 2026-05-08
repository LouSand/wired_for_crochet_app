'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { paymentFormSchema } from '@/lib/validators/payment'
import { assertProPlusTier } from './business-gate'
import type { PaymentRow, PaymentActionState } from '@/types/invoicing'

/**
 * Record a payment against an invoice.
 * Validates that amount_paid + new amount <= total.
 * Updates invoice amount_paid and status accordingly.
 */
export async function recordPayment(
  _prevState: PaymentActionState | null,
  formData: FormData
): Promise<PaymentActionState> {
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

  const rawData = {
    invoice_id: (formData.get('invoice_id') as string) || '',
    amount: parseFloat((formData.get('amount') as string) || '0'),
    payment_date: (formData.get('payment_date') as string) || '',
  }

  const result = paymentFormSchema.safeParse(rawData)

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

  // Fetch the invoice to check amount_paid + new amount <= total
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('id, total, amount_paid, status')
    .eq('id', validated.invoice_id)
    .eq('user_id', user.id)
    .single()

  if (invoiceError || !invoice) {
    return { success: false, error: 'Invoice not found.' }
  }

  const currentPaid = Number(invoice.amount_paid)
  const total = Number(invoice.total)
  const newAmount = validated.amount

  if (currentPaid + newAmount > total) {
    return {
      success: false,
      error: `Payment would exceed invoice total. Maximum allowed: £${(total - currentPaid).toFixed(2)}`,
      fieldErrors: { amount: [`Maximum payment allowed is £${(total - currentPaid).toFixed(2)}`] },
    }
  }

  // Insert payment
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      invoice_id: validated.invoice_id,
      user_id: user.id,
      amount: newAmount,
      payment_date: validated.payment_date,
    })
    .select()
    .single()

  if (paymentError || !payment) {
    return { success: false, error: 'Failed to record payment. Please try again.' }
  }

  // Update invoice amount_paid and status
  const newTotalPaid = currentPaid + newAmount
  let newStatus: string

  if (newTotalPaid >= total) {
    newStatus = 'paid'
  } else if (newTotalPaid > 0) {
    newStatus = 'partial'
  } else {
    newStatus = invoice.status
  }

  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      amount_paid: newTotalPaid,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', validated.invoice_id)
    .eq('user_id', user.id)

  if (updateError) {
    return { success: false, error: 'Payment recorded but failed to update invoice status.' }
  }

  revalidatePath(`/business/invoicing/invoices/${validated.invoice_id}`)
  revalidatePath('/business/invoicing/invoices')
  return { success: true, error: null, data: payment as PaymentRow }
}

/**
 * Delete a payment and recalculate invoice amount_paid and status.
 */
export async function deletePayment(
  paymentId: string,
  invoiceId: string
): Promise<PaymentActionState> {
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

  // Fetch the payment to get its amount
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('id, amount')
    .eq('id', paymentId)
    .eq('user_id', user.id)
    .single()

  if (paymentError || !payment) {
    return { success: false, error: 'Payment not found.' }
  }

  // Delete the payment
  const { error: deleteError } = await supabase
    .from('payments')
    .delete()
    .eq('id', paymentId)
    .eq('user_id', user.id)

  if (deleteError) {
    return { success: false, error: 'Failed to delete payment. Please try again.' }
  }

  // Recalculate invoice amount_paid from remaining payments
  const { data: remainingPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('invoice_id', invoiceId)

  const newTotalPaid = (remainingPayments || []).reduce(
    (sum, p) => sum + Number(p.amount),
    0
  )

  // Fetch invoice total to determine new status
  const { data: invoice } = await supabase
    .from('invoices')
    .select('total')
    .eq('id', invoiceId)
    .eq('user_id', user.id)
    .single()

  let newStatus: string
  if (!invoice) {
    newStatus = 'unpaid'
  } else {
    const total = Number(invoice.total)
    if (newTotalPaid >= total) {
      newStatus = 'paid'
    } else if (newTotalPaid > 0) {
      newStatus = 'partial'
    } else {
      newStatus = 'unpaid'
    }
  }

  // Update invoice
  await supabase
    .from('invoices')
    .update({
      amount_paid: newTotalPaid,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
    .eq('user_id', user.id)

  revalidatePath(`/business/invoicing/invoices/${invoiceId}`)
  revalidatePath('/business/invoicing/invoices')
  return { success: true, error: null }
}

/**
 * Fetch all payments for a given invoice, ordered by payment_date desc.
 */
export async function getPaymentsForInvoice(invoiceId: string): Promise<{
  data: PaymentRow[] | null
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

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .eq('user_id', user.id)
    .order('payment_date', { ascending: false })

  if (error) {
    return { data: null, error: 'Failed to fetch payments.' }
  }

  return { data: data as PaymentRow[], error: null }
}
