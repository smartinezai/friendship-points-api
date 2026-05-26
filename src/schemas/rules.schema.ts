import { z } from "zod";

export const createRuleBodySchema = z.object({
  scoreDelta: z.number().min(-10).max(10),
  reason: z.string().trim().min(8).max(1000).optional(), //reason is optional but if provided, it must be between 10 and 1000 characters
});

export type CreateRuleBody = z.infer<
  typeof createRuleBodySchema
>;