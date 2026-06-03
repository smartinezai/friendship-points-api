import { z } from "zod";

/** Validates prediction requests for hypothetical, unsaved events. */
export const predictFriendActionBodySchema = z.object({
  hypotheticalAction: z
    .string()
    .trim()
    .min(10, "Hypothetical action must be at least 10 characters long")
    .max(2000, "Hypothetical action must be at most 2000 characters long"),
});

export type PredictFriendActionBody = z.infer<
  typeof predictFriendActionBodySchema
>;
