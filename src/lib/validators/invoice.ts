import { z } from 'zod'

/**
 * Zod schema for a single invoice line item.
 */
export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  unit_price: z.number().positive('Unit price must be positive'),
})

/**
 * Zod schema for the invoice creation/edit form.
 */
export const invoiceFormSchema = z
  .object({
    customer_id: z.string().uuid('Customer is required'),
    issue_date: z.string().date('Valid issue date required'),
    due_date: z.string().date('Valid due date required'),
    items: z.array(invoiceItemSchema).min(1, 'At least one line item is required'),
    deposit_percent: z.number().int().min(0).max(100).default(40),
    stage2_percent: z.number().int().min(0).max(100).default(40),
    final_percent: z.number().int().min(0).max(100).default(20),
    project_id: z.string().uuid().optional().nullable(),
  })
  .refine((data) => data.deposit_percent + data.stage2_percent + data.final_percent === 100, {
    message: 'Stage percentages must sum to 100',
  })

/**
 * Inferred type from the invoice form schema.
 */
export type InvoiceFormData = z.infer<typeof invoiceFormSchema>

/**
 * Input type for the invoice form schema.
 */
export type InvoiceFormInput = z.input<typeof invoiceFormSchema>

/**
 * Inferred type from the invoice item schema.
 */
export type InvoiceItemData = z.infer<typeof invoiceItemSchema>
