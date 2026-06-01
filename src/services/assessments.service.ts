import { prisma } from "../db/prisma.js";
import type { LlmAssessmentInput } from "../ai/assessment.types.js";
import type { LlmAssessmentResult } from "../ai/assessment.schema.js";
import type { Prisma } from "../generated/prisma/client.js"


type EventWithFriendAndActiveRules = Prisma.EventGetPayload<{ //use Prisma's type system to define the type of the event with friend and active rules, this will help with type checking and autocompletion in the rest of the code where we use this data. We specify that we want to include the friend relation, and within that, we want to include the rules relation but only where the rules are active.
  include: {
    friend: {
      include: {
        rules: true;
      };
    };
  };
}>;
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
  event: EventWithFriendAndActiveRules // the type of event is the one we defined above, which includes the friend and active rules
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
  }
}


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

  const llmInput = buildLlmAssessmentInput(event);
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
  };
}