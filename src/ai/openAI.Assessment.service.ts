import {ChatOpenAI} from "@langchain/openai";
import type {LlmAssessmentInput} from "./assessment.types.js";
import {assessmentSchema, type LlmAssessmentResult} from "./assessment.schema.js"; //.js because it gets transpiled to js like all typescript stuff
import { buildFriendshipAssessmentPrompt } from "./prompts/friendshipAssessment.prompt.js";
import { LLM_MODELS, LLM_TEMPERATURE } from "./providers.js";

export async function openAiAssessEvent(
    input: LlmAssessmentInput
): Promise<LlmAssessmentResult> {
    const model = new ChatOpenAI({
        model: LLM_MODELS.openAI,
        temperature: LLM_TEMPERATURE,
    });

    const structuredModel= model.withStructuredOutput(assessmentSchema);

    const prompt = buildFriendshipAssessmentPrompt(input);
    const result = await structuredModel.invoke(prompt);
    return assessmentSchema.parse(result); //validate the result against the schema and return it as a LlmAssessmentResult, or throw an error if it doesn't match the schema
}
