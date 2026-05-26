import { z } from "zod";

export const manualAssessmentBodySchema = z.object({
  scoreDelta: z.number().min(-10).max(10),
  reason: z.string().trim().min(8).max(500).optional(), //reason is optional but if provided, it must be between 10 and 500 characters
});

export type ManualAssessmentBody = z.infer<
  typeof manualAssessmentBodySchema
>;