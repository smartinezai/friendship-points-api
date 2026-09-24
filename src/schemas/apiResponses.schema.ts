import { z } from "zod";
import { assessmentSchema } from "../ai/assessment.schema.js";
import { DOCUMENT_CHUNK_SOURCE_TYPE } from "../services/documentIngestion/documentSourceTypes.js";
import { impactDirectionSchema, ruleWeightSchema } from "./rules.schema.js";

/** Public friend fields returned by friend endpoints. */
export const friendDtoSchema = z.object({
    id: z.uuid(),
    displayName: z.string(),
    notes: z.string().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
});

/** Public rule fields returned by rule endpoints. */
export const ruleDtoSchema = z.object({
    id: z.uuid(),
    title: z.string(),
    description: z.string(),
    impactDirection: impactDirectionSchema,
    weight: ruleWeightSchema,
    active: z.boolean(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
});

/** Public event fields returned by event endpoints. */
export const eventDtoSchema = z.object({
    id: z.uuid(),
    eventText: z.string(),
    happenedAt: z.iso.datetime().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
});

/** Public assessment fields returned by assessment endpoints. */
export const assessmentDtoSchema = z.object({
    id: z.uuid(),
    scoreDelta: z.number(),
    reason: z.string().nullable(),
    source: z.string(),
    impactDirection: z.string().nullable(),
    biasNotes: z.string().nullable(),
    confidence: z.number().nullable(),
    matchedRuleIds: z.array(z.string()),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    modelName: z.string().nullable(),
    promptVersion: z.string().nullable(),
});

/** Public person-fact fields returned by fact endpoints. */
export const personFactDtoSchema = z.object({
    id: z.uuid(),
    content: z.string(),
    verificationStatus: z.string(),
    sourceType: z.string(),
    sourceId: z.string().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
});

/** Public answer fields nested in an intake submission. */
export const knowledgeIntakeAnswerDtoSchema = z.object({
    id: z.uuid(),
    questionKey: z.string(),
    questionText: z.string(),
    answerText: z.string(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
});

/** Public intake submission fields returned after creation. */
export const knowledgeIntakeSubmissionDtoSchema = z.object({
    id: z.uuid(),
    submittedByType: z.string(),
    sourceType: z.string(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    answers: z.array(knowledgeIntakeAnswerDtoSchema),
});

/** Shared shape for safe API error responses. */
export const apiErrorSchema = z.object({
    error: z.string(),
    details: z.array(z.unknown()).optional(),
});

/** Fastify's default error body for errors that are not handled by a route. */
export const fastifyErrorSchema = z.object({
    statusCode: z.number(),
    error: z.string(),
    message: z.string(),
});

/** Public document retrieval source types. */
export const searchableSourceTypeSchema = z.enum([
    "friend_note",
    "person_fact",
    "rule",
    "event",
    DOCUMENT_CHUNK_SOURCE_TYPE,
]);

/** Context item returned by search or passed to a prediction response. */
export const retrievedContextItemSchema = z.object({
    sourceType: searchableSourceTypeSchema,
    sourceId: z.string(),
    friendId: z.uuid(),
    content: z.string(),
    score: z.number(),
});

/** Context item returned by semantic retrieval. */
export const semanticRetrievedContextItemSchema = retrievedContextItemSchema.extend({
    distance: z.number(),
});

/** Context item returned after semantic retrieval and reranking. */
export const rerankedContextItemSchema = semanticRetrievedContextItemSchema.extend({
    rerankScore: z.number(),
    rerankReason: z.string(),
});

/** Summary returned after rebuilding a friend's searchable index. */
export const rebuildSearchIndexResponseSchema = z.object({
    message: z.string(),
    createdDocCount: z.number().int().nonnegative(),
});

/** Summary returned after ingesting a text or Markdown document. */
export const documentIngestionResponseSchema = z.object({
    friendId: z.uuid(),
    documentId: z.uuid(),
    title: z.string(),
    documentType: z.enum(["txt", "markdown"]),
    createdChunkCount: z.number().int().nonnegative(),
    sourceIds: z.array(z.uuid()),
});

/** Response returned by the development embedding maintenance route. */
export const embedMissingResponseSchema = z.object({
    embeddedCount: z.number().int().nonnegative(),
});

/** Response returned by the health check. */
export const healthResponseSchema = z.object({
    status: z.literal("ok"),
});

export const friendResponseSchema = z.object({ friend: friendDtoSchema });
export const friendsResponseSchema = z.object({ friends: z.array(friendDtoSchema) });
export const duplicateFriendResponseSchema = z.object({
    error: z.string(),
    existingFriend: friendDtoSchema,
});
export const ruleResponseSchema = z.object({ rule: ruleDtoSchema });
export const rulesResponseSchema = z.object({ rules: z.array(ruleDtoSchema) });
export const eventResponseSchema = z.object({ event: eventDtoSchema });
export const eventsResponseSchema = z.object({ events: z.array(eventDtoSchema) });
export const assessmentResponseSchema = z.object({ assessment: assessmentDtoSchema });
export const friendshipBalanceResponseSchema = z.object({
    friendId: z.uuid(),
    balance: z.number(),
});
export const personFactResponseSchema = z.object({ fact: personFactDtoSchema });
export const personFactsResponseSchema = z.object({ facts: z.array(personFactDtoSchema) });
export const knowledgeIntakeSubmissionResponseSchema = z.object({
    submission: knowledgeIntakeSubmissionDtoSchema,
});
export const predictionResponseSchema = z.object({
    prediction: assessmentSchema,
    retrievedContext: z.array(retrievedContextItemSchema.omit({ friendId: true })),
    saved: z.literal(false),
});
export const mistralPredictionResponseSchema = predictionResponseSchema.extend({
    source: z.literal("mistral"),
});
export const assessmentWithContextResponseSchema = z.object({
    assessment: assessmentDtoSchema,
    llmResult: assessmentSchema,
    retrievedContext: z.array(retrievedContextItemSchema.omit({ friendId: true })),
});
export const keywordSearchResponseSchema = z.object({
    results: z.array(retrievedContextItemSchema),
});
export const semanticSearchResponseSchema = z.object({
    results: z.array(semanticRetrievedContextItemSchema),
});
export const rerankedSearchResponseSchema = z.object({
    semanticResults: z.array(semanticRetrievedContextItemSchema),
    rerankedResults: z.array(rerankedContextItemSchema),
});
export const deleteFriendResponseSchema = z.object({
    message: z.string(),
});
