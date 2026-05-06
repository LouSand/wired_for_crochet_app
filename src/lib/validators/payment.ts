import { z } from 'zod'

/**
 * Zod schema for recording a payment against an invoice.
 */
export const paymentFormSchema = z.object({
  invoice_id: z.string().uuid('Invoice reference is required'),
  amount: z.number().positive('Amount must be positive'),
  payment_date: z.string().date('Valid payment date required'),
})

/**
 * Inferred type from the payment form schema.
 */
export type PaymentFormData = z.infer<typeof paymentFormSchema>

/**
 * Input type for the payment form schema.
 */
export type PaymentFormInput = z.input<typeof paymentFormSchema>
