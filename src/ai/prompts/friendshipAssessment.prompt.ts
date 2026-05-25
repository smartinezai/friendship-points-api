import type { LlmAssessmentInput } from "../assessment.types.js";
import { PROMPT_VERSION } from "../providers.js";

export function buildFriendshipAssessmentPrompt(
    input: LlmAssessmentInput
): string {
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

    return ` Prompt version:
    ${PROMPT_VERSION}
    
    You are an impartial judge that evaluates the impact of events on friendships based on the details of the event, the friend's preferences and boundaries and a set of rules that the friend has established for their friendships.

Friend details:
- Name: ${input.friend.displayName}
- Notes: ${input.friend.notes ?? "None"}

Event details:
- Text: ${input.event.eventText}
- Happened at: ${input.event.happenedAt ?? "Unknown"}

Active rules:
${rulesText || "None"}

Instructions:
- Determine whether the event is positive, negative, mixed or neutral.
- Assign scoreDelta as a number between -10 and 10 based on the event impact, any matched rules, and rule weights.
- Provide a confidence level for your assessment between 0 and 1.
- Use higher confidence when the event clearly matches rules and the wording is factual.
- Use lower confidence when the event is ambiguous, emotionally loaded, missing context, or depends on assumptions.
- Only include a rule ID in matchedRuleIds if the rule is directly semantically relevant to the event.
- Do not match a rule just because it exists.
- If no rule clearly applies, return matchedRuleIds as an empty array.
- A rule about one topic should not be used to assess an unrelated event.
- If the event is positive or negative even without a matching rule, you may still assign a scoreDelta, but matchedRuleIds should remain empty.
- Consider narrator bias, emotionally loaded wording, missing context, and uncertainty.
- Do not assume the other person's intent unless clearly supported.
- Return a short and concise reasoningSummary for the assignment.
- Note any potential biases in biasNotes that might be affecting your assessment, such as emotionally loaded wording, missing context, or assumptions about intent.
- Assess the impact of the event on the friendship using the provided information and rules.`;
}