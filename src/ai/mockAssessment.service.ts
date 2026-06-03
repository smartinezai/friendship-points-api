import type { LlmAssessmentInput } from "./assessment.types.js";
import { assessmentSchema, type LlmAssessmentResult } from "./assessment.schema.js";

/**
 * Deterministic assessment provider used for tests and local development.
 *
 * @param input - LLM assessment input built from event or prediction data.
 * @returns Validated assessment output without calling an external provider.
 */
export async function mockLlmAssessment(
  input: LlmAssessmentInput
): Promise<LlmAssessmentResult> {
  const mockResult = {
    impactDirection: "positive",
    scoreDelta: 10,
    confidence: 0.9,
    reasoningSummary:
      "The event had a positive impact on the friendship because it showed thoughtfulness and care.",
    matchedRuleIds: input.rules.map((rule) => rule.id),
    biasNotes:
      "The assessment may be biased because it is based on a mock implementation.",
  };

  return assessmentSchema.parse(mockResult);
}
