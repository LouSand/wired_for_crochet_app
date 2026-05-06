import { z } from "zod";

/**
 * Zod schema for creating a new supplier.
 */
export const supplierFormSchema = z.object({
  name: z
    .string()
    .nonempty("Supplier name is required")
    .max(255, "Supplier name must be 255 characters or less"),
  website: z
    .string()
    .max(500, "Website must be 500 characters or less")
    .optional()
    .or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

/**
 * Inferred type from the supplier form schema.
 */
export type SupplierFormData = z.infer<typeof supplierFormSchema>;

/**
 * Input type for the supplier form schema.
 */
export type SupplierFormInput = z.input<typeof supplierFormSchema>;

/**
 * Partial update schema for editing an existing supplier.
 */
export const supplierUpdateSchema = supplierFormSchema.partial();

/**
 * Inferred type from the supplier update schema.
 */
export type SupplierUpdateData = z.infer<typeof supplierUpdateSchema>;
