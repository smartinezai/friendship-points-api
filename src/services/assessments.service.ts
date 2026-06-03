import { prisma } from "../db/prisma.js";
import type { LlmAssessmentInput } from "../ai/assessment.types.js";
import type { LlmAssessmentResult } from "../ai/assessment.schema.js";
import { retrieveFriendContext } from "./search.service.js";



export async function getEventWithFriendAndActiveRules(eventId: string) {
  return prisma.event.findUnique({
    where: { id: eventId },
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
      happenedAt: event.happenedAt ? event.happenedAt.toISOString() : null, //convert happenedAt to ISO string if it exists, otherwise set it to null
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


export async function assessEventWithProvider(
  eventId: string,
  source: string,
  assessFn: (input: LlmAssessmentInput) => Promise<LlmAssessmentResult>,
  metadata?: {
    modelName?: string;
    promptVersion?: string;
  }
) {
  /**
   * from the event id, fetch event with friend and active rules
   * then build the llm input from that data
   * call the chosen assessment provider (for example mock or langchain)
   * then save the assessment and return the assessment as well as the LLM output result
   */
  const event = await getEventWithFriendAndActiveRules(eventId);

  if (!event) {
    return null;
  }
  const retrievedContext = await retrieveFriendContext(
    event.friendId,
    event.eventText,
    {//retrieve relevant context for this event but not the event itself (otherwise we get redundant data)
      excludeSourceType: "event",
      excludeSourceId: event.id,
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