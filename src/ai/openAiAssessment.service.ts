import { ChatOpenAI } from "@langchain/openai";
import type { LlmAssessmentInput } from "./assessment.types.js";
import { assessmentSchema, type LlmAssessmentResult } from "./assessment.schema.js";
import { buildFriendshipAssessmentPrompt } from "./prompts/friendshipAssessment.prompt.js";
import { LLM_MODELS, LLM_TEMPERATURE } from "./providers.js";

/**
 * Assesses an event or prediction with OpenAI structured output.
 *
 * @param input - Provider-agnostic assessment input.
 * @returns Validated LLM assessment result.
 */
export async function openAiAssessEvent(
    input: LlmAssessmentInput
): Promise<LlmAssessmentResult> {
    const model = new ChatOpenAI({
        model: LLM_MODELS.openAi,
        temperature: LLM_TEMPERATURE,
    });

    const structuredModel = model.withStructuredOutput(assessmentSchema);

    const prompt = buildFriendshipAssessmentPrompt(input);
    const result = await structuredModel.invoke(prompt);
    return assessmentSchema.parse(result);
}
