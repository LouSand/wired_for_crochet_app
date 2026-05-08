import { z } from "zod";

/**
 * Zod schema for creating a new counter.
 * Used by both React Hook Form (client-side) and Server Actions (server-side).
 */
export const counterFormSchema = z.object({
  name: z
    .string()
    .nonempty("Counter name is required")
    .max(100, "Counter name must be 100 characters or less"),
  target_value: z
    .number()
    .int("Target value must be a whole number")
    .positive("Target value must be greater than 0")
    .optional(),
  sort_order: z
    .number()
    .int("Sort order must be a whole number")
    .nonnegative("Sort order must be non-negative")
    .optional(),
});

/**
 * Inferred type from the counter form schema.
 * Represents the validated output data.
 */
export type CounterFormData = z.infer<typeof counterFormSchema>;

/**
 * Input type for the counter form schema.
 */
export type CounterFormInput = z.input<typeof counterFormSchema>;
