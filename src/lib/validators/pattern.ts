import { z } from "zod";

/**
 * Zod schema for creating a new pattern.
 * Used by both React Hook Form (client-side) and Server Actions (server-side).
 *
 * Fields:
 * - title: required, varchar(255)
 * - type: required, 'written' or 'uploaded'
 * - introduction: optional text
 * - materials_list: optional text
 * - hook_size: optional, varchar(50)
 * - yarn_info: optional text
 * - gauge: optional text
 * - abbreviations: optional text
 * - instructions: optional text
 * - notes: optional text
 */
export const patternFormSchema = z.object({
  title: z
    .string()
    .nonempty("Pattern title is required")
    .max(255, "Title must be 255 characters or less"),
  type: z.enum(["written", "uploaded"], {
    message: "Type must be 'written' or 'uploaded'",
  }),
  introduction: z.string().optional(),
  materials_list: z.string().optional(),
  hook_size: z
    .string()
    .max(50, "Hook size must be 50 characters or less")
    .optional(),
  yarn_info: z.string().optional(),
  gauge: z.string().optional(),
  abbreviations: z.string().optional(),
  instructions: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Inferred type from the pattern form schema.
 */
export type PatternFormData = z.infer<typeof patternFormSchema>;

/**
 * Input type for the pattern form schema.
 */
export type PatternFormInput = z.input<typeof patternFormSchema>;

/**
 * Partial update schema for editing an existing pattern.
 * All fields are optional, allowing partial updates.
 */
export const patternUpdateSchema = patternFormSchema.partial();

/**
 * Inferred type from the pattern update schema.
 */
export type PatternUpdateData = z.infer<typeof patternUpdateSchema>;
