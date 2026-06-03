import type {
  LlmAssessmentInput,
  LlmRetrievedContextItem,
} from "../ai/assessment.types.js";
import type { LlmAssessmentResult } from "../ai/assessment.schema.js";
import { prisma } from "../db/prisma.js";
import { retrieveFriendContext } from "./search.service.js";

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

type PredictionProvider = ( //define a function type where the input is an LlmAssessmentInput and the output is a Promise that resolves to an LlmAssessmentResult. This will allow us to pass in different assessment functions, such as one for Mistral
  input: LlmAssessmentInput,
) => Promise<LlmAssessmentResult>;

export async function getFriendWithActiveRules(friendId: string) {
  return prisma.friend.findUnique({
    where: { id: friendId },
    include: {
      rules: {
        where: { active: true },
      },
    },
  });
}


export function buildPredictionInput(
  friend: FriendWithActiveRules,
  hypotheticalAction: string,
  retrievedContext: LlmRetrievedContextItem[] = [],
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
    retrievedContext,
  };
}

/**
 * Runs a prediction flow for a hypothetical friend action using the provided
 * assessment provider.
 *
 * The flow loads the friend, retrieves relevant RAG context, builds the LLM
 * input, calls the provider, and returns an unsaved prediction result.
 */

export async function predictFriendActionWithProvider(
  friendId: string,
  hypotheticalAction: string,
  provider: PredictionProvider,
) {
  const friend = await getFriendWithActiveRules(friendId);

  if (!friend) {
    return null;
  }

  const retrievedContext = await retrieveFriendContext(
    friendId,
    hypotheticalAction,
    { limit: 5 },
  );

  const predictionInput = buildPredictionInput(
    friend,
    hypotheticalAction,
    retrievedContext,
  );

  const prediction = await provider(predictionInput);

  return {
    prediction,
    retrievedContext,
    saved: false,
  };
}
