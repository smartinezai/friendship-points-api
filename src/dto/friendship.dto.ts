import type {
    Assessment,
    Event,
    Friend,
    KnowledgeIntakeAnswer,
    KnowledgeIntakeSubmission,
    PersonFact,
    Rule,
} from "../generated/prisma/client.js";
import {
    assessmentDtoSchema,
    assessmentResponseSchema,
    assessmentWithContextResponseSchema,
    duplicateFriendResponseSchema,
    eventDtoSchema,
    eventResponseSchema,
    eventsResponseSchema,
    friendDtoSchema,
    friendResponseSchema,
    friendsResponseSchema,
    friendshipBalanceResponseSchema,
    knowledgeIntakeAnswerDtoSchema,
    knowledgeIntakeSubmissionDtoSchema,
    knowledgeIntakeSubmissionResponseSchema,
    mistralPredictionResponseSchema,
    personFactDtoSchema,
    personFactResponseSchema,
    personFactsResponseSchema,
    predictionResponseSchema,
    rebuildSearchIndexResponseSchema,
    ruleDtoSchema,
    ruleResponseSchema,
    rulesResponseSchema,
} from "../schemas/apiResponses.schema.js";
import { z } from "zod";

/** Entity DTOs omit database-only ownership and parent-record keys. */

export type FriendDto = z.infer<typeof friendDtoSchema>;
export type RuleDto = z.infer<typeof ruleDtoSchema>;
export type EventDto = z.infer<typeof eventDtoSchema>;
export type AssessmentDto = z.infer<typeof assessmentDtoSchema>;
export type PersonFactDto = z.infer<typeof personFactDtoSchema>;
export type KnowledgeIntakeAnswerDto = z.infer<typeof knowledgeIntakeAnswerDtoSchema>;
export type KnowledgeIntakeSubmissionDto = z.infer<typeof knowledgeIntakeSubmissionDtoSchema>;
export type FriendResponseDto = z.infer<typeof friendResponseSchema>;
export type FriendsResponseDto = z.infer<typeof friendsResponseSchema>;
export type DuplicateFriendResponseDto = z.infer<typeof duplicateFriendResponseSchema>;
export type RuleResponseDto = z.infer<typeof ruleResponseSchema>;
export type RulesResponseDto = z.infer<typeof rulesResponseSchema>;
export type EventResponseDto = z.infer<typeof eventResponseSchema>;
export type EventsResponseDto = z.infer<typeof eventsResponseSchema>;
export type AssessmentResponseDto = z.infer<typeof assessmentResponseSchema>;
export type FriendshipBalanceResponseDto = z.infer<typeof friendshipBalanceResponseSchema>;
export type RebuildSearchIndexResponseDto = z.infer<typeof rebuildSearchIndexResponseSchema>;
export type PersonFactResponseDto = z.infer<typeof personFactResponseSchema>;
export type PersonFactsResponseDto = z.infer<typeof personFactsResponseSchema>;
export type KnowledgeIntakeSubmissionResponseDto = z.infer<typeof knowledgeIntakeSubmissionResponseSchema>;
export type PredictionResponseDto = z.infer<typeof predictionResponseSchema>;
export type MistralPredictionResponseDto = z.infer<typeof mistralPredictionResponseSchema>;
export type AssessmentWithContextResponseDto = z.infer<typeof assessmentWithContextResponseSchema>;

/** Maps a database friend row to the fields intentionally exposed by the API. */
export function toFriendDto(friend: Friend): FriendDto {
    return {
        id: friend.id,
        displayName: friend.displayName,
        notes: friend.notes,
        createdAt: friend.createdAt.toISOString(),
        updatedAt: friend.updatedAt.toISOString(),
    } satisfies FriendDto;
}

/** Maps a database rule row to the fields intentionally exposed by the API. */
export function toRuleDto(rule: Rule): RuleDto {
    return {
        id: rule.id,
        title: rule.title,
        description: rule.description,
        impactDirection: rule.impactDirection,
        weight: rule.weight,
        active: rule.active,
        createdAt: rule.createdAt.toISOString(),
        updatedAt: rule.updatedAt.toISOString(),
    } satisfies RuleDto;
}

/** Maps a database event row to the fields intentionally exposed by the API. */
export function toEventDto(event: Event): EventDto {
    return {
        id: event.id,
        eventText: event.eventText,
        happenedAt: event.happenedAt?.toISOString() ?? null,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
    } satisfies EventDto;
}

/** Maps a database assessment row to the fields intentionally exposed by the API. */
export function toAssessmentDto(assessment: Assessment): AssessmentDto {
    return {
        id: assessment.id,
        scoreDelta: assessment.scoreDelta,
        reason: assessment.reason,
        source: assessment.source,
        impactDirection: assessment.impactDirection,
        biasNotes: assessment.biasNotes,
        confidence: assessment.confidence,
        matchedRuleIds: [...assessment.matchedRuleIds],
        createdAt: assessment.createdAt.toISOString(),
        updatedAt: assessment.updatedAt.toISOString(),
        modelName: assessment.modelName,
        promptVersion: assessment.promptVersion,
    } satisfies AssessmentDto;
}

/** Maps a database person fact row to the fields intentionally exposed by the API. */
export function toPersonFactDto(fact: PersonFact): PersonFactDto {
    return {
        id: fact.id,
        content: fact.content,
        verificationStatus: fact.verificationStatus,
        sourceType: fact.sourceType,
        sourceId: fact.sourceId,
        createdAt: fact.createdAt.toISOString(),
        updatedAt: fact.updatedAt.toISOString(),
    } satisfies PersonFactDto;
}

/** Maps a stored intake submission and answers to the public response shape. */
export function toKnowledgeIntakeSubmissionDto(
    submission: KnowledgeIntakeSubmission & { answers: KnowledgeIntakeAnswer[] },
): KnowledgeIntakeSubmissionDto {
    return {
        id: submission.id,
        submittedByType: submission.submittedByType,
        sourceType: submission.sourceType,
        createdAt: submission.createdAt.toISOString(),
        updatedAt: submission.updatedAt.toISOString(),
        answers: submission.answers.map((answer) => ({
            id: answer.id,
            questionKey: answer.questionKey,
            questionText: answer.questionText,
            answerText: answer.answerText,
            createdAt: answer.createdAt.toISOString(),
            updatedAt: answer.updatedAt.toISOString(),
        } satisfies KnowledgeIntakeAnswerDto)),
    } satisfies KnowledgeIntakeSubmissionDto;
}
