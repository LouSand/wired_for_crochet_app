import { z } from "zod";

/**
 * Zod schema for manually editing a time session.
 * Used for validating form data when a user edits start_time, end_time, or note.
 */
export const timeSessionUpdateSchema = z
  .object({
    start_time: z
      .string()
      .nonempty("Start time is required")
      .refine(
        (val) => !isNaN(Date.parse(val)),
        "Must be a valid ISO datetime string"
      ),
    end_time: z
      .string()
      .refine(
        (val) => val === "" || !isNaN(Date.parse(val)),
        "Must be a valid ISO datetime string"
      )
      .optional(),
    note: z.string().max(1000, "Note must be 1000 characters or less").optional(),
  })
  .refine(
    (data) => {
      if (data.end_time && data.end_time !== "") {
        return new Date(data.end_time) > new Date(data.start_time);
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["end_time"],
    }
  );

/**
 * Inferred type from the time session update schema.
 */
export type TimeSessionUpdateData = z.infer<typeof timeSessionUpdateSchema>;

/**
 * Input type for the time session update schema.
 */
export type TimeSessionUpdateInput = z.input<typeof timeSessionUpdateSchema>;
