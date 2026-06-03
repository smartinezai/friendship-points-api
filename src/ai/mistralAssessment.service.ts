import { ChatMistralAI } from "@langchain/mistralai";
import type { LlmAssessmentInput } from "./assessment.types.js";
import { assessmentSchema, type LlmAssessmentResult } from "./assessment.schema.js";
import { buildFriendshipAssessmentPrompt } from "./prompts/friendshipAssessment.prompt.js";
import { LLM_MODELS, LLM_TEMPERATURE } from "./providers.js";

/**
 * Assesses an event or prediction with Mistral structured output.
 *
 * @param input - Provider-agnostic assessment input.
 * @returns Validated LLM assessment result.
 */
export async function mistralAssessEvent(
  input: LlmAssessmentInput
): Promise<LlmAssessmentResult> {
  const model = new ChatMistralAI({
    model: LLM_MODELS.mistral,
    temperature: LLM_TEMPERATURE,
  });

  const structuredModel = model.withStructuredOutput(assessmentSchema);
  const prompt = buildFriendshipAssessmentPrompt(input);

  const result = await structuredModel.invoke(prompt);

  return assessmentSchema.parse(result);
}
