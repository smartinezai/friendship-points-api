import type { LlmAssessmentInput } from "./assessment.types.js";
import { assessmentSchema, type LlmAssessmentResult } from "./assessment.schema.js"; //import the assessmentSchema and LlmAssessmentResult type from the assessment.schema file. The assessmentSchema is used to validate the structure of the LLM output, while the LlmAssessmentResult type defines the expected shape of the assessment result that our mock function will return.

export async function mockLlmAssessment(
  input: LlmAssessmentInput
): Promise<LlmAssessmentResult> {
    //take llmAssessment input and return a promise because it's async (when the promise resolves the value will be of type LlmAssessmentResult). This function simulates the behavior of an LLM by returning a hardcoded assessment result based on the input provided. The mock result includes an impact direction, score delta, confidence level, reasoning summary, matched rule IDs, and optional bias notes. By using the assessmentSchema to parse the mock result, we ensure that the returned data adheres to the expected structure and validation rules defined in the schema.
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

  return assessmentSchema.parse(mockResult); //validate the mock result against the assessmentSchema to ensure it matches the expected structure and types defined in the schema. If the mockResult does not conform to the schema, an error will be thrown, which helps catch any issues with the structure of the data before it is used in the application.
}