import { z } from "zod";

/**
 * Zod schema for creating a new customer.
 */
export const customerFormSchema = z.object({
  name: z
    .string()
    .nonempty("Customer name is required")
    .max(255, "Customer name must be 255 characters or less"),
  email: z
    .string()
    .email("Must be a valid email address")
    .max(255, "Email must be 255 characters or less")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .max(50, "Phone must be 50 characters or less")
    .optional()
    .or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

/**
 * Inferred type from the customer form schema.
 */
export type CustomerFormData = z.infer<typeof customerFormSchema>;

/**
 * Input type for the customer form schema.
 */
export type CustomerFormInput = z.input<typeof customerFormSchema>;

/**
 * Partial update schema for editing an existing customer.
 */
export const customerUpdateSchema = customerFormSchema.partial();

/**
 * Inferred type from the customer update schema.
 */
export type CustomerUpdateData = z.infer<typeof customerUpdateSchema>;
