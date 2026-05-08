import { z } from "zod";

/**
 * Yarn weight category enum values.
 * Matches the YarnWeightCategory type in src/types/forms.ts.
 */
export const YARN_WEIGHT_CATEGORIES = [
  "lace",
  "fingering",
  "sport",
  "dk",
  "worsted",
  "aran",
  "bulky",
  "super_bulky",
] as const;

/**
 * Zod schema for the yarn weight category enum.
 */
export const yarnWeightCategorySchema = z.enum(YARN_WEIGHT_CATEGORIES);

/**
 * Zod schema for creating a new yarn entry.
 * Used by both React Hook Form (client-side) and Server Actions (server-side).
 */
export const yarnFormSchema = z.object({
  name: z
    .string()
    .nonempty("Yarn name is required")
    .max(255, "Yarn name must be 255 characters or less"),
  brand: z
    .string()
    .max(255, "Brand must be 255 characters or less")
    .optional(),
  colour: z
    .string()
    .max(100, "Colour must be 100 characters or less")
    .optional(),
  shade_code: z
    .string()
    .max(50, "Shade code must be 50 characters or less")
    .optional(),
  dye_lot: z
    .string()
    .max(50, "Dye lot must be 50 characters or less")
    .optional(),
  weight_category: yarnWeightCategorySchema.optional(),
  thickness: z
    .string()
    .max(50, "Thickness must be 50 characters or less")
    .optional(),
  fibre_content: z.string().optional(),
  washing_instructions: z.string().optional(),
  recommended_hook_size: z
    .string()
    .max(20, "Recommended hook size must be 20 characters or less")
    .optional(),
  quantity_owned: z
    .number()
    .nonnegative("Quantity owned must be non-negative")
    .default(0),
  cost_per_unit: z
    .number()
    .nonnegative("Cost per unit must be non-negative")
    .optional(),
});

/**
 * Inferred type from the yarn form schema.
 * Represents the validated output data.
 */
export type YarnFormData = z.infer<typeof yarnFormSchema>;

/**
 * Input type for the yarn form schema (before defaults are applied).
 */
export type YarnFormInput = z.input<typeof yarnFormSchema>;

/**
 * Partial update schema for editing an existing yarn entry.
 * All fields are optional, allowing partial updates.
 */
export const yarnUpdateSchema = yarnFormSchema.partial();

/**
 * Inferred type from the yarn update schema.
 */
export type YarnUpdateData = z.infer<typeof yarnUpdateSchema>;

/**
 * Zod schema for linking yarn to a project (yarn_usages table).
 */
export const yarnUsageSchema = z.object({
  yarn_entry_id: z.string().uuid("Must be a valid UUID"),
  project_id: z.string().uuid("Must be a valid UUID"),
  quantity_used: z
    .number()
    .nonnegative("Quantity used must be non-negative"),
});

/**
 * Inferred type from the yarn usage schema.
 */
export type YarnUsageData = z.infer<typeof yarnUsageSchema>;

/**
 * Input type for the yarn usage schema.
 */
export type YarnUsageInput = z.input<typeof yarnUsageSchema>;
