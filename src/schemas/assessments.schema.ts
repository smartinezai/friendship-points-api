import { z } from "zod";

/** Validates POST /events/:eventId/manual-assessment request bodies. */
export const manualAssessmentBodySchema = z.object({
  scoreDelta: z.number().min(-10).max(10),
  reason: z.string().trim().min(8).max(500).optional(),
});

export type ManualAssessmentBody = z.infer<
  typeof manualAssessmentBodySchema
>;
