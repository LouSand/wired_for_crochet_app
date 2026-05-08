import { z } from "zod";
import { EXPENSE_CATEGORIES } from "@/types/business";

/**
 * Zod schema for the expense category enum.
 */
export const expenseCategorySchema = z.enum(EXPENSE_CATEGORIES);

/**
 * Zod schema for creating a new purchase/expense.
 */
export const purchaseFormSchema = z.object({
  purchase_date: z
    .string()
    .nonempty("Purchase date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a valid ISO date (YYYY-MM-DD)"),
  description: z
    .string()
    .nonempty("Description is required")
    .max(500, "Description must be 500 characters or less"),
  category: expenseCategorySchema,
  cost: z
    .number({ error: "Cost is required and must be a number" })
    .nonnegative("Cost must be non-negative"),
  supplier_id: z.string().uuid("Must be a valid UUID").optional().or(z.literal("")),
  invoice_path: z.string().optional().or(z.literal("")),
  invoice_file_name: z.string().optional().or(z.literal("")),
});

/**
 * Inferred type from the purchase form schema.
 */
export type PurchaseFormData = z.infer<typeof purchaseFormSchema>;

/**
 * Input type for the purchase form schema.
 */
export type PurchaseFormInput = z.input<typeof purchaseFormSchema>;

/**
 * Partial update schema for editing an existing purchase.
 */
export const purchaseUpdateSchema = purchaseFormSchema.partial();

/**
 * Inferred type from the purchase update schema.
 */
export type PurchaseUpdateData = z.infer<typeof purchaseUpdateSchema>;
