import { z } from "zod";

/**
 * Supported currency codes (ISO 4217).
 */
export const SUPPORTED_CURRENCIES = ['USD', 'GBP', 'EUR', 'AUD', 'CAD', 'NZD'] as const;

/**
 * Project status enum values.
 * Matches the ProjectStatus type in src/types/forms.ts.
 */
export const PROJECT_STATUSES = [
  "planned",
  "in_progress",
  "paused",
  "completed",
  "abandoned",
] as const;

/**
 * Project difficulty enum values.
 * Matches the ProjectDifficulty type in src/types/forms.ts.
 */
export const PROJECT_DIFFICULTIES = [
  "beginner",
  "easy",
  "intermediate",
  "advanced",
  "expert",
] as const;

/**
 * Zod schema for the project status enum.
 */
export const projectStatusSchema = z.enum(PROJECT_STATUSES);

/**
 * Zod schema for the project difficulty enum.
 */
export const projectDifficultySchema = z.enum(PROJECT_DIFFICULTIES);

/**
 * Zod schema for creating a new project.
 * Used by both React Hook Form (client-side) and Server Actions (server-side).
 */
export const projectFormSchema = z.object({
  name: z.string().nonempty("Project name is required").max(255, "Project name must be 255 characters or less"),
  description: z.string().optional(),
  status: projectStatusSchema.default("planned"),
  difficulty: projectDifficultySchema.optional(),
  customer_name: z.string().max(255, "Customer name must be 255 characters or less").optional(),
  date_started: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a valid ISO date (YYYY-MM-DD)").optional(),
  date_completed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a valid ISO date (YYYY-MM-DD)").optional(),
  estimated_completion_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a valid ISO date (YYYY-MM-DD)").optional(),
  priority: z.number().int().min(1, "Priority must be between 1 and 5").max(5, "Priority must be between 1 and 5").optional(),
  hourly_rate_override: z.number().nonnegative("Hourly rate must be non-negative").optional(),
  pattern_id: z.string().uuid("Must be a valid UUID").optional(),
  currency: z.enum(SUPPORTED_CURRENCIES).default('USD'),
  profit_margin: z.number().nonnegative("Profit margin must be non-negative").optional(),
});

/**
 * Inferred type from the project form schema.
 * Represents the validated output data.
 */
export type ProjectFormData = z.infer<typeof projectFormSchema>;

/**
 * Input type for the project form schema (before defaults are applied).
 */
export type ProjectFormInput = z.input<typeof projectFormSchema>;

/**
 * Partial update schema for editing an existing project.
 * All fields are optional, allowing partial updates.
 */
export const projectUpdateSchema = projectFormSchema.partial();

/**
 * Inferred type from the project update schema.
 */
export type ProjectUpdateData = z.infer<typeof projectUpdateSchema>;
