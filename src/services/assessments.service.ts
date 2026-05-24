import { prisma } from "../db/prisma.js";
import type { LlmAssessmentInput } from "../ai/assessment.types.js";
import { fr } from "zod/locales";
import type {LlmAssessmentResult} from "../ai/assessment.schema.js";

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
    event: NonNullable<Awaited<ReturnType<typeof getEventWithFriendAndActiveRules>>> //use the return type of getEventWithFriendAndActiveRules, wait for the async result, and remove null from the possible values.
): LlmAssessmentInput { 
    const friend = event.friend;
    const rules = friend.rules;

    return {
        friend:{
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
    }
}


export async function saveLlmAssessment(
  eventId: string,
  llmResult: LlmAssessmentResult,
  source: string
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
    },
  });
}