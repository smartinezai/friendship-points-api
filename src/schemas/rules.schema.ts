import { z } from "zod";

export const createRuleBodySchema = z.object({
  title: z.string().min(2 , "Title must be at least 2 characters long").max(100, "Title must be at most 100 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters long").max(1000, "Description must be at most 1000 characters long"),
  impactDirection: z.enum(["positive", "negative", "neutral", "mixed"]),
  weight: z.enum(["minimal", "low", "medium", "high", "critical", "extreme"]),
});

export type CreateRuleBody = z.infer<
  typeof createRuleBodySchema
>;