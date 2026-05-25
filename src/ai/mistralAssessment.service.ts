import { ChatMistralAI } from "@langchain/mistralai";
import type { LlmAssessmentInput } from "./assessment.types.js";
import { assessmentSchema, type LlmAssessmentResult } from "./assessment.schema.js";
import { buildFriendshipAssessmentPrompt } from "./prompts/friendshipAssessment.prompt.js";

export async function mistralAssessEvent(
  input: LlmAssessmentInput
): Promise<LlmAssessmentResult> {
  const model = new ChatMistralAI({
    model: "mistral-tiny-latest",
    temperature: 0.2,
  });

  const structuredModel = model.withStructuredOutput(assessmentSchema);
  const prompt = buildFriendshipAssessmentPrompt(input);

  const result = await structuredModel.invoke(prompt);

  return assessmentSchema.parse(result);
}