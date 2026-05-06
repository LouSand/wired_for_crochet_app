import { z } from 'zod'

/**
 * Zod schema for a single quote line item.
 */
export const quoteItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  unit_price: z.number().positive('Unit price must be positive'),
})

/**
 * Zod schema for the quote creation/edit form.
 */
export const quoteFormSchema = z.object({
  customer_id: z.string().uuid('Customer is required'),
  issue_date: z.string().date('Valid issue date required'),
  items: z.array(quoteItemSchema).min(1, 'At least one line item is required'),
})

/**
 * Inferred type from the quote form schema.
 */
export type QuoteFormData = z.infer<typeof quoteFormSchema>

/**
 * Input type for the quote form schema.
 */
export type QuoteFormInput = z.input<typeof quoteFormSchema>

/**
 * Inferred type from the quote item schema.
 */
export type QuoteItemData = z.infer<typeof quoteItemSchema>
