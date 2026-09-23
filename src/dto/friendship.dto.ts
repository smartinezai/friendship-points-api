import type {
    Assessment,
    Event,
    Friend,
    KnowledgeIntakeAnswer,
    KnowledgeIntakeSubmission,
    PersonFact,
    Rule,
} from "../generated/prisma/client.js";
import type { LlmAssessmentResult } from "../ai/assessment.schema.js";
import type { ImpactDirection, RuleWeight } from "../domain/friendship.js";
import type { LlmRetrievedContextItem } from "../ai/assessment.types.js";

/** Entity DTOs omit database-only ownership and parent-record keys. */

/** Stable friend fields returned by the public API. */
export type FriendDto = {
    id: string;
    displayName: string;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
};

/** Stable rule fields returned by the public API. */
export type RuleDto = {
    id: string;
    title: string;
    description: string;
    impactDirection: ImpactDirection;
    weight: RuleWeight;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
};

/** Stable event fields returned by the public API. */
export type EventDto = {
    id: string;
    eventText: string;
    happenedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

/** Stable assessment fields returned by the public API. */
export type AssessmentDto = {
    id: string;
    scoreDelta: number;
    reason: string | null;
    source: string;
    impactDirection: string | null;
    biasNotes: string | null;
    confidence: number | null;
    matchedRuleIds: string[];
    createdAt: Date;
    updatedAt: Date;
    modelName: string | null;
    promptVersion: string | null;
};

/** Stable person-fact fields returned by the public API. */
export type PersonFactDto = {
    id: string;
    content: string;
    verificationStatus: string;
    sourceType: string;
    sourceId: string | null;
    createdAt: Date;
    updatedAt: Date;
};

export type KnowledgeIntakeAnswerDto = {
    id: string;
    questionKey: string;
    questionText: string;
    answerText: string;
    createdAt: Date;
    updatedAt: Date;
};

export type KnowledgeIntakeSubmissionDto = {
    id: string;
    submittedByType: string;
    sourceType: string;
    createdAt: Date;
    updatedAt: Date;
    answers: KnowledgeIntakeAnswerDto[];
};

export type FriendResponseDto = { friend: FriendDto };
export type FriendsResponseDto = { friends: FriendDto[] };
export type DuplicateFriendResponseDto = {
    error: string;
    existingFriend: FriendDto;
};
export type RuleResponseDto = { rule: RuleDto };
export type RulesResponseDto = { rules: RuleDto[] };
export type EventResponseDto = { event: EventDto };
export type EventsResponseDto = { events: EventDto[] };
export type AssessmentResponseDto = { assessment: AssessmentDto };
export type FriendshipBalanceResponseDto = {
    friendId: string;
    balance: number;
};
export type RebuildSearchIndexResponseDto = {
    message: string;
    createdDocCount: number;
};
export type PersonFactResponseDto = { fact: PersonFactDto };
export type PersonFactsResponseDto = { facts: PersonFactDto[] };
export type KnowledgeIntakeSubmissionResponseDto = {
    submission: KnowledgeIntakeSubmissionDto;
};
export type PredictionResponseDto = {
    prediction: LlmAssessmentResult;
    retrievedContext: LlmRetrievedContextItem[];
    saved: false;
};
export type MistralPredictionResponseDto = PredictionResponseDto & {
    source: "mistral";
};
export type AssessmentWithContextResponseDto = {
    assessment: AssessmentDto;
    llmResult: LlmAssessmentResult;
    retrievedContext: LlmRetrievedContextItem[];
};

/** Maps a database friend row to the fields intentionally exposed by the API. */
export function toFriendDto(friend: Friend): FriendDto {
    return {
        id: friend.id,
        displayName: friend.displayName,
        notes: friend.notes,
        createdAt: friend.createdAt,
        updatedAt: friend.updatedAt,
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
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
    } satisfies RuleDto;
}

/** Maps a database event row to the fields intentionally exposed by the API. */
export function toEventDto(event: Event): EventDto {
    return {
        id: event.id,
        eventText: event.eventText,
        happenedAt: event.happenedAt,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
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
        createdAt: assessment.createdAt,
        updatedAt: assessment.updatedAt,
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
        createdAt: fact.createdAt,
        updatedAt: fact.updatedAt,
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
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
        answers: submission.answers.map((answer) => ({
            id: answer.id,
            questionKey: answer.questionKey,
            questionText: answer.questionText,
            answerText: answer.answerText,
            createdAt: answer.createdAt,
            updatedAt: answer.updatedAt,
        } satisfies KnowledgeIntakeAnswerDto)),
    } satisfies KnowledgeIntakeSubmissionDto;
}
