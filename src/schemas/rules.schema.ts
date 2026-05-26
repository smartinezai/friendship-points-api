import { z } from "zod";

export const ruleWeightSchema = z.enum([
  "minimal", 
  "low", 
  "medium", 
  "high", 
  "critical", 
  "extreme"
]);

export const impactDirectionSchema = z.enum([
  "positive", 
  "negative", 
  "neutral", 
  "mixed"
]);

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

export const updateRuleWeightBodySchema = z.object({
  weight: ruleWeightSchema,
});

export type CreateRuleBody = z.infer<typeof createRuleBodySchema>;
export type UpdateRuleWeightBody = z.infer<typeof updateRuleWeightBodySchema>;