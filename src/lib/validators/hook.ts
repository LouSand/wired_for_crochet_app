import { z } from "zod";

/**
 * Zod schema for creating a new hook entry.
 * Used by both React Hook Form (client-side) and Server Actions (server-side).
 *
 * Fields:
 * - size: required, varchar(20) — e.g., "4.0mm", "G/6"
 * - type: optional, varchar(50) — e.g., "inline", "tapered"
 * - brand: optional, varchar(255)
 * - material: optional, varchar(100) — e.g., "aluminum", "bamboo", "steel"
 */
export const hookFormSchema = z.object({
  size: z
    .string()
    .nonempty("Hook size is required")
    .max(20, "Hook size must be 20 characters or less"),
  type: z
    .string()
    .max(50, "Type must be 50 characters or less")
    .optional(),
  brand: z
    .string()
    .max(255, "Brand must be 255 characters or less")
    .optional(),
  material: z
    .string()
    .max(100, "Material must be 100 characters or less")
    .optional(),
});

/**
 * Inferred type from the hook form schema.
 * Represents the validated output data.
 */
export type HookFormData = z.infer<typeof hookFormSchema>;

/**
 * Input type for the hook form schema.
 */
export type HookFormInput = z.input<typeof hookFormSchema>;

/**
 * Partial update schema for editing an existing hook entry.
 * All fields are optional, allowing partial updates.
 */
export const hookUpdateSchema = hookFormSchema.partial();

/**
 * Inferred type from the hook update schema.
 */
export type HookUpdateData = z.infer<typeof hookUpdateSchema>;

/**
 * Zod schema for linking a hook to a project (hook_usages table).
 */
export const hookUsageSchema = z.object({
  hook_entry_id: z.string().uuid("Must be a valid UUID"),
  project_id: z.string().uuid("Must be a valid UUID"),
  note: z.string().max(500, "Note must be 500 characters or less").optional(),
});

/**
 * Inferred type from the hook usage schema.
 */
export type HookUsageData = z.infer<typeof hookUsageSchema>;

/**
 * Input type for the hook usage schema.
 */
export type HookUsageInput = z.input<typeof hookUsageSchema>;
