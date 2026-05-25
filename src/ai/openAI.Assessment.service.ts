import {ChatOpenAI} from "@langchain/openai";
import type {LlmAssessmentInput} from "./assessment.types.js";
import {assessmentSchema, type LlmAssessmentResult} from "./assessment.schema.js"; //.js because it gets transpiled to js like all typescript stuff
import { buildFriendshipAssessmentPrompt } from "./prompts/friendshipAssessment.prompt.js";

export async function langchainAssessEvent(
    input: LlmAssessmentInput
): Promise<LlmAssessmentResult> {
    const model = new ChatOpenAI({
        model: "gpt-4o-mini",
        temperature: 0.2,
    });

    const structuredModel= model.withStructuredOutput(assessmentSchema);

    const prompt = buildFriendshipAssessmentPrompt(input);
    const result = await structuredModel.invoke(prompt);
    return assessmentSchema.parse(result); //validate the result against the schema and return it as a LlmAssessmentResult, or throw an error if it doesn't match the schema
}
