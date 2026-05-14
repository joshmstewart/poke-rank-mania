import { z } from "zod";

/**
 * Mirrors the DB CHECK constraints on public.feedback_submissions.
 * Keep these limits in sync with the migration.
 */
export const FEEDBACK_TYPES = [
  "bug",
  "feature",
  "improvement",
  "question",
  "other",
] as const;

export const feedbackSchema = z.object({
  type: z.enum(FEEDBACK_TYPES),
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or fewer"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(5000, "Description must be 5000 characters or fewer"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email")
    .max(255, "Email must be 255 characters or fewer")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  url: z
    .string()
    .trim()
    .max(2048, "URL must be 2048 characters or fewer")
    .optional(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;