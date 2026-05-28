import type { LlmAssessmentInput } from "../ai/assessment.types.js";


type FriendWithActiveRules = {
  id: string;
  displayName: string;
  notes: string | null;
  rules: {
    id: string;
    title: string;
    description: string;
    impactDirection: string;
    weight: string;
  }[];
};

export function buildPredictionInput(
  friend: FriendWithActiveRules,
  hypotheticalAction: string
): LlmAssessmentInput {
    //build the input for the LLM assessment based on the friend data and the hypothetical action. The input should include the friend's id, display name, and notes, as well as the hypothetical action and the friend's active rules. For the rules, we want to include the rule's id, title, description, impact direction, and weight. We will return an object that matches the LlmAssessmentInput type.
  return {
    friend: {
      id: friend.id,
      displayName: friend.displayName,
      notes: friend.notes,
    },
    event: {
      id: "hypothetical-event",
      eventText: hypotheticalAction,
      happenedAt: null,
    },
    rules: friend.rules.map((rule) => ({
      id: rule.id,
      title: rule.title,
      description: rule.description,
      impactDirection: rule.impactDirection,
      weight: rule.weight,
    })),
  };
}