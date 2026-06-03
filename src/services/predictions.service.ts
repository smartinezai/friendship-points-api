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

type PredictionProvider = (
  input: LlmAssessmentInput,
) => Promise<LlmAssessmentResult>;

/**
 * Loads the active friend data needed to predict a hypothetical action.
 *
 * @param friendId - Friend id from the prediction route.
 * @returns Friend with active rules, or null when missing/deleted.
 */
export async function getFriendWithActiveRules(friendId: string) {
  return prisma.friend.findFirst({
    where: {
      id: friendId,
      deletedAt: null,
    },
    include: {
      rules: {
        where: { active: true },
      },
    },
  });
}

/**
 * Builds LLM input for a hypothetical, unsaved event.
 *
 * @param friend - Friend with active rules already loaded.
 * @param hypotheticalAction - User-provided action to predict.
 * @param retrievedContext - Optional RAG context relevant to the action.
 * @returns Provider-agnostic LLM input using a synthetic event id.
 */
export function buildPredictionInput(
  friend: FriendWithActiveRules,
  hypotheticalAction: string,
  retrievedContext: LlmRetrievedContextItem[] = [],
): LlmAssessmentInput {
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
 * Runs the full prediction flow without creating an Event or Assessment.
 *
 * @param friendId - Friend the hypothetical action is about.
 * @param hypotheticalAction - Action text to assess as a hypothetical event.
 * @param provider - LLM provider implementation used to score the action.
 * @returns Prediction result with retrieved context, or null if friend is missing.
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
