import { z } from "zod";

/**
 * Zod schema for creating a new BOM line item.
 */
export const bomLineItemFormSchema = z.object({
  material_id: z
    .string()
    .nonempty("Material is required")
    .uuid("Must be a valid UUID"),
  quantity_required: z
    .number({ error: "Quantity is required and must be a number" })
    .positive("Quantity must be greater than zero"),
});

/**
 * Inferred type from the BOM line item form schema.
 */
export type BomLineItemFormData = z.infer<typeof bomLineItemFormSchema>;

/**
 * Input type for the BOM line item form schema.
 */
export type BomLineItemFormInput = z.input<typeof bomLineItemFormSchema>;

/**
 * Partial update schema for editing an existing BOM line item.
 */
export const bomLineItemUpdateSchema = bomLineItemFormSchema.partial();

/**
 * Inferred type from the BOM line item update schema.
 */
export type BomLineItemUpdateData = z.infer<typeof bomLineItemUpdateSchema>;
