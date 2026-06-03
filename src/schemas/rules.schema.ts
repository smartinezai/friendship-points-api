import { z } from "zod";

/** Allowed rule weights from least to greatest impact. */
export const ruleWeightSchema = z.enum([
  "minimal", 
  "low", 
  "medium", 
  "high", 
  "critical", 
  "extreme"
]);

/** Direction a rule says an event should move the friendship score. */
export const impactDirectionSchema = z.enum([
  "positive", 
  "negative", 
  "neutral", 
  "mixed"
]);

/** Validates POST /friends/:friendId/rules request bodies. */
export const createRuleBodySchema = z.object({
  title: z.string()
    .trim()
    .min(2 , "Title must be at least 2 characters long")
    .max(100, "Title must be at most 100 characters long"),
  description: z.string()
    .trim()
    .min(10, "Description must be at least 10 characters long")
    .max(1000, "Description must be at most 1000 characters long"),
  impactDirection: impactDirectionSchema,
  weight: ruleWeightSchema,
});

/** Validates PATCH /rules/:ruleId/weight request bodies. */
export const updateRuleWeightBodySchema = z.object({
  weight: ruleWeightSchema,
});

export type CreateRuleBody = z.infer<typeof createRuleBodySchema>;
export type UpdateRuleWeightBody = z.infer<typeof updateRuleWeightBodySchema>;
