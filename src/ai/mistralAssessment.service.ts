import { ChatMistralAI } from "@langchain/mistralai";
import type { LlmAssessmentInput } from "./assessment.types.js";
import { assessmentSchema, type LlmAssessmentResult } from "./assessment.schema.js";

export async function mistralAssessEvent(
  input: LlmAssessmentInput
): Promise<LlmAssessmentResult> {
  const model = new ChatMistralAI({
    model: "mistral-tiny-latest",
    temperature: 0.2,
  });

  const structuredModel = model.withStructuredOutput(assessmentSchema);

  const rulesText = input.rules
    .map(
      (rule) =>
        `Rule ID: ${rule.id}
Title: ${rule.title}
Description: ${rule.description}
Impact direction: ${rule.impactDirection}
Weight: ${rule.weight}`
    )
    .join("\n\n");

  const prompt = `You are an impartial judge that evaluates the impact of events on friendships based on the details of the event, the friend's preferences and boundaries, and a set of active rules.

Friend details:
- Name: ${input.friend.displayName}
- Notes: ${input.friend.notes ?? "None"}

Event details:
- Text: ${input.event.eventText}
- Happened at: ${input.event.happenedAt ?? "Unknown"}

Active rules:
${rulesText || "None"}

Instructions:
- Determine whether the event is positive, negative, mixed, or neutral.
- Assign scoreDelta as a number between -10 and 10 based on the weight of the matched rules and impact direction.
- Provide confidence between 0 and 1.
- Use higher confidence when the event clearly matches rules and the wording is factual.
- Use lower confidence when the event is ambiguous, emotionally loaded, missing context, or depends on assumptions.
- Use matchedRuleIds only for rules that actually influenced the assessment.
- Consider narrator bias, emotionally loaded wording, missing context, and uncertainty.
- Do not assume the other person's intent unless clearly supported.
- Return a concise reasoningSummary.
- Note any potential biases in biasNotes.`;

  const result = await structuredModel.invoke(prompt);

  return assessmentSchema.parse(result);
}