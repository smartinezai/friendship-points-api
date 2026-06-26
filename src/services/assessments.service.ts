import { prisma } from "../db/prisma.js";
import type { LlmAssessmentInput } from "../ai/assessment.types.js";
import type { LlmAssessmentResult } from "../ai/assessment.schema.js";
import { retrieveFriendContext } from "./search.service.js";


/**
 * Loads an event with the friend and active rules needed for LLM assessment.
 *
 * @param eventId - Event id being assessed.
 * @param ownerUserId - Current user that must own the event's friend.
 * @returns Event graph for prompt building, or null when the event is missing.
 */
export async function getEventWithFriendAndActiveRules(
  eventId: string,
  ownerUserId: string,
) {
  return prisma.event.findFirst({
    where: {
      id: eventId,
      friend: { ownerUserId },
    },
    include: {
      friend: {
        include: {
          rules: {
            where: {
              active: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Builds the provider-agnostic LLM input for assessing an existing event.
 *
 * @param event - Event loaded with its friend and active rules.
 * @param retrievedContext - Optional RAG context to include in the prompt.
 * @returns Structured input consumed by mock, Mistral, and OpenAI providers.
 */
export function buildLlmAssessmentInput(
  event: NonNullable<Awaited<ReturnType<typeof getEventWithFriendAndActiveRules>>>,
  retrievedContext: LlmAssessmentInput["retrievedContext"] = [],
): LlmAssessmentInput {
  const friend = event.friend;
  const rules = friend.rules;

  return {
    friend: {
      id: friend.id,
      displayName: friend.displayName,
      notes: friend.notes,
    },
    event: {
      id: event.id,
      eventText: event.eventText,
      happenedAt: event.happenedAt ? event.happenedAt.toISOString() : null,
    },
    rules: rules.map((rule) => ({
      id: rule.id,
      title: rule.title,
      description: rule.description,
      impactDirection: rule.impactDirection,
      weight: rule.weight,
    })),
    retrievedContext,
  }
};

/**
 * Persists a validated LLM assessment result.
 *
 * @param eventId - Event the assessment belongs to.
 * @param llmResult - Structured provider output validated by assessmentSchema.
 * @param source - Provider label, e.g. "mock", "mistral", or "openai".
 * @param metadata - Optional model and prompt metadata for traceability.
 * @returns The created Assessment record.
 */
export async function saveLlmAssessment(
  eventId: string,
  llmResult: LlmAssessmentResult,
  source: string,
  metadata?: {
    modelName?: string;
    promptVersion?: string;
  }
) {
  return prisma.assessment.create({
    data: {
      eventId,
      scoreDelta: llmResult.scoreDelta,
      reason: llmResult.reasoningSummary,
      source,
      impactDirection: llmResult.impactDirection,
      biasNotes: llmResult.biasNotes ?? null,
      confidence: llmResult.confidence,
      matchedRuleIds: llmResult.matchedRuleIds,
      modelName: metadata?.modelName ?? null,
      promptVersion: metadata?.promptVersion ?? null,
    },
  });
}

/**
 * Runs the full event-assessment flow with the selected LLM provider.
 *
 * @param eventId - Event to assess.
 * @param ownerUserId - Current user that must own the event's friend.
 * @param source - Source label stored on the Assessment row.
 * @param assessFn - Provider function that accepts LlmAssessmentInput.
 * @param metadata - Optional model and prompt metadata stored with the result.
 * @returns Assessment, raw LLM result, and retrieved context, or null if missing.
 */
export async function assessEventWithProvider(
  eventId: string,
  ownerUserId: string,
  source: string,
  assessFn: (input: LlmAssessmentInput) => Promise<LlmAssessmentResult>,
  metadata?: {
    modelName?: string;
    promptVersion?: string;
  }
) {
  const event = await getEventWithFriendAndActiveRules(eventId, ownerUserId);

  if (!event) {
    return null;
  }
  const retrievedContext = await retrieveFriendContext(
    event.friendId,
    event.eventText,
    {
      // Exclude the current event so retrieval only contributes extra context.
      excludeSourceType: "event",
      excludeSourceId: event.id,
      limit: 5,
    }
  );
  const llmInput = buildLlmAssessmentInput(event, retrievedContext);
  const llmResult = await assessFn(llmInput);
  const assessment = await saveLlmAssessment(
    eventId,
    llmResult,
    source,
    metadata,
  );

  return {
    assessment,
    llmResult,
    retrievedContext,
  };

};
