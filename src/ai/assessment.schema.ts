import { z } from "zod";

/** Validates structured output returned by mock and real LLM providers. */
export const assessmentSchema = z.object({
    scoreDelta: z.number().min(-10).max(10),
    impactDirection: z.enum(["positive", "negative", "neutral", "mixed"]),
    confidence: z.number().min(0).max(1),
    reasoningSummary: z.string().trim().min(10).max(500),
    matchedRuleIds: z.array(z.string()),
    biasNotes: z.string().trim().min(10).max(500).optional()
});

/** TypeScript representation of validated LLM assessment output. */
export type LlmAssessmentResult = z.infer<typeof assessmentSchema>;
