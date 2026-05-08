import { z } from "zod";
import { PRODUCT_STATUSES } from "@/types/business";

/**
 * Zod schema for the product status enum.
 */
export const productStatusSchema = z.enum(PRODUCT_STATUSES);

/**
 * Zod schema for creating a new product.
 * Named business-product to avoid conflict with existing project validator.
 */
export const productFormSchema = z.object({
  name: z
    .string()
    .nonempty("Product name is required")
    .max(255, "Product name must be 255 characters or less"),
  description: z.string().optional().or(z.literal("")),
  sell_price: z
    .number({ error: "Sell price is required and must be a number" })
    .nonnegative("Sell price must be non-negative"),
  status: productStatusSchema.default("active"),
  photo_path: z.string().optional().or(z.literal("")),
  time_taken_minutes: z
    .number({ error: "Time taken must be a number" })
    .int("Time taken must be a whole number")
    .nonnegative("Time taken must be non-negative")
    .optional()
    .nullable(),
  wages_per_minute: z
    .number({ error: "Wages per minute must be a number" })
    .nonnegative("Wages per minute must be non-negative")
    .optional()
    .nullable(),
  profit_margin_percent: z
    .number({ error: "Profit margin must be a number" })
    .nonnegative("Profit margin must be non-negative")
    .optional()
    .nullable(),
});

/**
 * Inferred type from the product form schema.
 */
export type ProductFormData = z.infer<typeof productFormSchema>;

/**
 * Input type for the product form schema.
 */
export type ProductFormInput = z.input<typeof productFormSchema>;

/**
 * Partial update schema for editing an existing product.
 */
export const productUpdateSchema = productFormSchema.partial();

/**
 * Inferred type from the product update schema.
 */
export type ProductUpdateData = z.infer<typeof productUpdateSchema>;
