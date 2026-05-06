import { z } from 'zod'

/**
 * Zod schema for the business profile settings form.
 */
export const businessProfileSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  address: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  bank_account_name: z.string().optional().default(''),
  bank_account_number: z.string().optional().default(''),
  bank_sort_code: z
    .string()
    .regex(/^\d{2}-\d{2}-\d{2}$/, 'Sort code must be in format XX-XX-XX')
    .optional()
    .or(z.literal('')),
  logo_url: z.string().url().optional().nullable(),
})

/**
 * Inferred type from the business profile schema.
 */
export type BusinessProfileFormData = z.infer<typeof businessProfileSchema>

/**
 * Input type for the business profile schema.
 */
export type BusinessProfileFormInput = z.input<typeof businessProfileSchema>
