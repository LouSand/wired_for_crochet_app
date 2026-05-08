import { z } from "zod";
import { MATERIAL_CATEGORIES, MATERIAL_UNITS } from "@/types/business";

/**
 * Zod schema for the material category enum.
 */
export const materialCategorySchema = z.enum(MATERIAL_CATEGORIES);

/**
 * Zod schema for the material unit enum.
 */
export const materialUnitSchema = z.enum(MATERIAL_UNITS);

/**
 * Zod schema for creating a new material.
 */
export const materialFormSchema = z.object({
  name: z
    .string()
    .nonempty("Material name is required")
    .max(255, "Material name must be 255 characters or less"),
  material_type: z.string().max(50, "Material type must be 50 characters or less").optional().or(z.literal("")),
  category: materialCategorySchema,
  colour: z.string().max(100, "Colour must be 100 characters or less").optional().or(z.literal("")),
  quantity_owned: z
    .number({ error: "Quantity owned must be a number" })
    .nonnegative("Quantity owned must be non-negative")
    .default(0),
  quantity_used: z
    .number({ error: "Quantity used must be a number" })
    .nonnegative("Quantity used must be non-negative")
    .default(0),
  total_cost: z
    .number({ error: "Total cost must be a number" })
    .nonnegative("Total cost must be non-negative")
    .optional()
    .nullable(),
  unit: materialUnitSchema.default("pieces"),
});

/**
 * Inferred type from the material form schema.
 */
export type MaterialFormData = z.infer<typeof materialFormSchema>;

/**
 * Input type for the material form schema.
 */
export type MaterialFormInput = z.input<typeof materialFormSchema>;

/**
 * Partial update schema for editing an existing material.
 */
export const materialUpdateSchema = materialFormSchema.partial();

/**
 * Inferred type from the material update schema.
 */
export type MaterialUpdateData = z.infer<typeof materialUpdateSchema>;
