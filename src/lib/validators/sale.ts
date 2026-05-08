import { z } from "zod";

/**
 * Zod schema for creating a new sale.
 */
export const saleFormSchema = z.object({
  sale_date: z
    .string()
    .nonempty("Sale date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a valid ISO date (YYYY-MM-DD)"),
  product_id: z.string().uuid("Must be a valid UUID").optional().or(z.literal("")),
  customer_id: z.string().uuid("Must be a valid UUID").optional().or(z.literal("")),
  quantity_sold: z
    .number({ error: "Quantity is required and must be a number" })
    .int("Quantity must be a whole number")
    .positive("Quantity must be greater than zero")
    .default(1),
  sale_price: z
    .number({ error: "Sale price is required and must be a number" })
    .nonnegative("Sale price must be non-negative"),
});

/**
 * Inferred type from the sale form schema.
 */
export type SaleFormData = z.infer<typeof saleFormSchema>;

/**
 * Input type for the sale form schema.
 */
export type SaleFormInput = z.input<typeof saleFormSchema>;

/**
 * Partial update schema for editing an existing sale.
 */
export const saleUpdateSchema = saleFormSchema.partial();

/**
 * Inferred type from the sale update schema.
 */
export type SaleUpdateData = z.infer<typeof saleUpdateSchema>;
