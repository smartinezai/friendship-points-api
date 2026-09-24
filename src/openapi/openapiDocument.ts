import { z } from "zod";
import { assessmentSchema } from "../ai/assessment.schema.js";
import {
    appendFriendNoteBodySchema,
    createFriendBodySchema,
    updateFriendBodySchema,
} from "../schemas/friends.schema.js";
import { createRuleBodySchema, updateRuleWeightBodySchema } from "../schemas/rules.schema.js";
import { createEventBodySchema } from "../schemas/events.schema.js";
import { manualAssessmentBodySchema } from "../schemas/assessments.schema.js";
import { predictFriendActionBodySchema } from "../schemas/predictions.schema.js";
import {
    createPersonFactBodySchema,
    updatePersonFactVerificationStatusBodySchema,
} from "../schemas/personFacts.schema.js";
import { createKnowledgeIntakeSubmissionBodySchema } from "../schemas/knowledgeIntake.schema.js";
import { ingestDocumentBodySchema } from "../schemas/document.schema.js";
import {
    apiErrorSchema,
    assessmentDtoSchema,
    assessmentResponseSchema,
    assessmentWithContextResponseSchema,
    deleteFriendResponseSchema,
    documentIngestionResponseSchema,
    duplicateFriendResponseSchema,
    embedMissingResponseSchema,
    eventResponseSchema,
    eventsResponseSchema,
    eventDtoSchema,
    fastifyErrorSchema,
    friendDtoSchema,
    friendResponseSchema,
    friendsResponseSchema,
    friendshipBalanceResponseSchema,
    healthResponseSchema,
    keywordSearchResponseSchema,
    knowledgeIntakeSubmissionResponseSchema,
    mistralPredictionResponseSchema,
    personFactDtoSchema,
    personFactResponseSchema,
    personFactsResponseSchema,
    predictionResponseSchema,
    rebuildSearchIndexResponseSchema,
    rerankedSearchResponseSchema,
    ruleDtoSchema,
    ruleResponseSchema,
    rulesResponseSchema,
    semanticSearchResponseSchema,
} from "../schemas/apiResponses.schema.js";

type JsonSchema = Record<string, unknown>;

/** Removes Zod's closed-object marker because request parsing strips extra keys. */
function allowStrippedRequestKeys(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(allowStrippedRequestKeys);
    }

    if (value === null || typeof value !== "object") {
        return value;
    }

    const result: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
        if (key === "additionalProperties" && nestedValue === false) {
            continue;
        }
        result[key] = allowStrippedRequestKeys(nestedValue);
    }
    return result;
}

/** Converts a Zod schema into the JSON Schema dialect used by OpenAPI 3.1. */
function toOpenApiSchema(
    schema: z.ZodType,
    mode: "input" | "output" = "output",
): JsonSchema {
    const result = z.toJSONSchema(schema, {
        target: "draft-2020-12",
        io: mode,
        unrepresentable: "any",
    }) as JsonSchema;
    delete result.$schema;

    return mode === "input"
        ? allowStrippedRequestKeys(result) as JsonSchema
        : result;
}

/** References one named schema in the OpenAPI components section. */
function schemaRef(name: string): JsonSchema {
    return { $ref: `#/components/schemas/${name}` };
}

type Parameter = {
    name: string;
    in: "path" | "query" | "header";
    required: boolean;
    description: string;
    schema: JsonSchema;
    example?: string;
};

/** Describes a UUID path parameter. */
function uuidPathParameter(name: string): Parameter {
    return {
        name,
        in: "path",
        required: true,
        description: "UUID of the resource.",
        schema: { type: "string", format: "uuid" },
        example: "5da77ede-2290-4ede-9839-d83a29a310e6",
    };
}

/** Describes the optional development user selector used by owner-scoped routes. */
function userHeaderParameter(): Parameter {
    return {
        name: "x-user-id",
        in: "header",
        required: false,
        description: "Development user ID selector. This is not authentication. If omitted the seeded development user is used.",
        schema: { type: "string", format: "uuid" },
        example: "00000000-0000-4000-8000-000000000001",
    };
}

/** Describes a required non-empty query parameter. */
function requiredTextQueryParameter(name: string, description: string, example: string): Parameter {
    return {
        name,
        in: "query",
        required: true,
        description,
        schema: { type: "string", minLength: 1 },
        example,
    };
}

type BodyDefinition = {
    schema: string;
    example: unknown;
};

type OperationDefinition = {
    tag: string;
    summary: string;
    description: string;
    successStatus: "200" | "201";
    successDescription: string;
    successSchema: string;
    successExample?: unknown;
    parameters?: Parameter[];
    userScoped?: boolean;
    body?: BodyDefinition;
    badRequest?: boolean;
    notFound?: boolean;
    duplicate?: boolean;
    serverError?: boolean;
};

/** Adds a standard JSON response to an operation response map. */
function jsonResponse(description: string, schema: JsonSchema, example?: unknown): JsonSchema {
    return {
        description,
        content: {
            "application/json": {
                schema,
                ...(example === undefined ? {} : { example }),
            },
        },
    };
}

/** Builds one documented route operation with its request and response contract. */
function operation(definition: OperationDefinition): JsonSchema {
    const parameters = [
        ...(definition.parameters ?? []),
        ...(definition.userScoped ? [userHeaderParameter()] : []),
    ];
    const responses: Record<string, JsonSchema> = {
        [definition.successStatus]: jsonResponse(
            definition.successDescription,
            schemaRef(definition.successSchema),
            definition.successExample,
        ),
    };

    if (definition.badRequest) {
        responses["400"] = jsonResponse(
            "The request body, path ID or query parameter is invalid.",
            schemaRef("ApiError"),
            { error: "Invalid request body", details: [] },
        );
    }
    if (definition.duplicate) {
        responses["409"] = jsonResponse(
            "An active friend already uses this display name.",
            schemaRef("DuplicateFriendResponse"),
        );
    }
    if (definition.notFound) {
        responses["404"] = jsonResponse(
            "The resource does not exist or is not available to this user.",
            schemaRef("ApiError"),
            { error: "Friend not found" },
        );
    }
    if (definition.serverError !== false) {
        responses["500"] = jsonResponse(
            "A provider, database or unexpected server error occurred.",
            schemaRef("ServerError"),
            { error: "An internal server error occurred." },
        );
    }

    return {
        tags: [definition.tag],
        summary: definition.summary,
        description: definition.description,
        ...(parameters.length === 0 ? {} : { parameters }),
        ...(definition.body === undefined
            ? {}
            : {
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: schemaRef(definition.body.schema),
                            example: definition.body.example,
                        },
                    },
                },
            }),
        responses,
    };
}

const friendId = uuidPathParameter("id");
const friendIdParam = uuidPathParameter("friendId");
const eventId = uuidPathParameter("eventId");
const ruleId = uuidPathParameter("ruleId");
const factId = uuidPathParameter("factId");

const schemas: Record<string, z.ZodType> = {
    ApiError: apiErrorSchema,
    ServerError: z.union([apiErrorSchema, fastifyErrorSchema]),
    Friend: friendDtoSchema,
    Rule: ruleDtoSchema,
    Event: eventDtoSchema,
    Assessment: assessmentDtoSchema,
    PersonFact: personFactDtoSchema,
    KnowledgeIntakeSubmissionResponse: knowledgeIntakeSubmissionResponseSchema,
    FriendResponse: friendResponseSchema,
    FriendsResponse: friendsResponseSchema,
    DuplicateFriendResponse: duplicateFriendResponseSchema,
    RuleResponse: ruleResponseSchema,
    RulesResponse: rulesResponseSchema,
    EventResponse: eventResponseSchema,
    EventsResponse: eventsResponseSchema,
    AssessmentResponse: assessmentResponseSchema,
    AssessmentWithContextResponse: assessmentWithContextResponseSchema,
    FriendshipBalanceResponse: friendshipBalanceResponseSchema,
    PersonFactResponse: personFactResponseSchema,
    PersonFactsResponse: personFactsResponseSchema,
    PredictionResponse: predictionResponseSchema,
    MistralPredictionResponse: mistralPredictionResponseSchema,
    RebuildSearchIndexResponse: rebuildSearchIndexResponseSchema,
    DocumentIngestionResponse: documentIngestionResponseSchema,
    EmbedMissingResponse: embedMissingResponseSchema,
    HealthResponse: healthResponseSchema,
    DeleteFriendResponse: deleteFriendResponseSchema,
    KeywordSearchResponse: keywordSearchResponseSchema,
    SemanticSearchResponse: semanticSearchResponseSchema,
    RerankedSearchResponse: rerankedSearchResponseSchema,
    CreateFriendBody: createFriendBodySchema,
    UpdateFriendBody: updateFriendBodySchema,
    AppendFriendNoteBody: appendFriendNoteBodySchema,
    CreateRuleBody: createRuleBodySchema,
    UpdateRuleWeightBody: updateRuleWeightBodySchema,
    CreateEventBody: createEventBodySchema,
    ManualAssessmentBody: manualAssessmentBodySchema,
    PredictFriendActionBody: predictFriendActionBodySchema,
    CreatePersonFactBody: createPersonFactBodySchema,
    UpdatePersonFactVerificationStatusBody: updatePersonFactVerificationStatusBodySchema,
    CreateKnowledgeIntakeSubmissionBody: createKnowledgeIntakeSubmissionBodySchema,
    IngestDocumentBody: ingestDocumentBodySchema,
    LlmAssessment: assessmentSchema,
};

/** Builds the complete OpenAPI contract from the route inventory and shared Zod schemas. */
export function buildOpenApiDocument(): JsonSchema {
    const components: Record<string, JsonSchema> = {};
    for (const [name, schema] of Object.entries(schemas)) {
        components[name] = toOpenApiSchema(
            schema,
            name.endsWith("Body") ? "input" : "output",
        );
    }
    components.UpdateFriendBody = {
        ...components.UpdateFriendBody,
        anyOf: [
            { required: ["displayName"] },
            { required: ["notes"] },
        ],
    };

    const paths: Record<string, Record<string, JsonSchema>> = {
        "/health": {
            get: operation({
                tag: "Health",
                summary: "Check API health",
                description: "Returns a simple health status.",
                successStatus: "200",
                successDescription: "The API is responding.",
                successSchema: "HealthResponse",
                successExample: { status: "ok" },
                serverError: false,
            }),
        },
        "/friends": {
            get: operation({
                tag: "Friends",
                summary: "List friends",
                description: "Returns active friends belonging to the selected development user.",
                successStatus: "200",
                successDescription: "Active friends.",
                successSchema: "FriendsResponse",
                successExample: { friends: [] },
                userScoped: true,
            }),
            post: operation({
                tag: "Friends",
                summary: "Create a friend",
                description: "Creates a friend record. Duplicate active display names require `allowDuplicate: true`.",
                successStatus: "201",
                successDescription: "The friend was created.",
                successSchema: "FriendResponse",
                successExample: {
                    friend: {
                        id: "5da77ede-2290-4ede-9839-d83a29a310e6",
                        displayName: "Cole Bailey",
                        notes: "Prefers planned calls.",
                        createdAt: "2026-06-24T12:00:00.000Z",
                        updatedAt: "2026-06-24T12:00:00.000Z",
                    },
                },
                body: {
                    schema: "CreateFriendBody",
                    example: { displayName: "Cole Bailey", notes: "Prefers planned calls." },
                },
                userScoped: true,
                badRequest: true,
                duplicate: true,
            }),
        },
        "/friends/search": {
            get: operation({
                tag: "Friends",
                summary: "Search friends by name",
                description: "Searches active friends by a case-insensitive display-name match.",
                successStatus: "200",
                successDescription: "Matching friends.",
                successSchema: "FriendsResponse",
                successExample: { friends: [] },
                parameters: [requiredTextQueryParameter("name", "Text to find in display names.", "Cole")],
                userScoped: true,
                badRequest: true,
            }),
        },
        "/friends/{id}": {
            get: operation({
                tag: "Friends",
                summary: "Get a friend",
                description: "Returns an active friend owned by the selected development user.",
                successStatus: "200",
                successDescription: "The friend.",
                successSchema: "FriendResponse",
                parameters: [friendId],
                userScoped: true,
                badRequest: true,
                notFound: true,
            }),
            patch: operation({
                tag: "Friends",
                summary: "Update a friend",
                description: "Updates the display name or notes. At least one field is required.",
                successStatus: "200",
                successDescription: "The updated friend.",
                successSchema: "FriendResponse",
                parameters: [friendId],
                body: { schema: "UpdateFriendBody", example: { notes: "Prefers scheduled calls." } },
                userScoped: true,
                badRequest: true,
                notFound: true,
            }),
            delete: operation({
                tag: "Friends",
                summary: "Soft-delete a friend",
                description: "Marks a friend as deleted. Related history remains stored.",
                successStatus: "200",
                successDescription: "The friend was marked deleted.",
                successSchema: "DeleteFriendResponse",
                successExample: { message: "Friend deleted successfully" },
                parameters: [friendId],
                userScoped: true,
                badRequest: true,
                notFound: true,
            }),
        },
        "/friends/{id}/notes/append": {
            post: operation({
                tag: "Friends",
                summary: "Append a friend note",
                description: "Adds a note after the existing notes without replacing them.",
                successStatus: "200",
                successDescription: "The friend with updated notes.",
                successSchema: "FriendResponse",
                parameters: [friendId],
                body: { schema: "AppendFriendNoteBody", example: { note: "Cole prefers planned calls." } },
                userScoped: true,
                badRequest: true,
                notFound: true,
            }),
        },
        "/friends/{id}/search-context": {
            get: operation({
                tag: "Search",
                summary: "Search friend context by keywords",
                description: "Returns up to five matching indexed context items for manual inspection.",
                successStatus: "200",
                successDescription: "Keyword matches.",
                successSchema: "KeywordSearchResponse",
                successExample: { results: [] },
                parameters: [friendId, requiredTextQueryParameter("query", "Text used to find relevant context.", "planned calls")],
                userScoped: true,
                badRequest: true,
                notFound: true,
            }),
        },
        "/friends/{id}/search-context/semantic": {
            get: operation({
                tag: "Search",
                summary: "Search friend context by meaning",
                description: "Returns up to five context items ranked by embedding distance.",
                successStatus: "200",
                successDescription: "Semantic matches.",
                successSchema: "SemanticSearchResponse",
                successExample: { results: [] },
                parameters: [friendId, requiredTextQueryParameter("query", "Text embedded for semantic retrieval.", "planned calls")],
                userScoped: true,
                badRequest: true,
                notFound: true,
            }),
        },
        "/friends/{id}/search-context/reranked": {
            get: operation({
                tag: "Search",
                summary: "Search and rerank friend context",
                description: "Returns semantic matches and their final keyword and semantic reranking.",
                successStatus: "200",
                successDescription: "Semantic matches and reranked matches.",
                successSchema: "RerankedSearchResponse",
                successExample: { semanticResults: [], rerankedResults: [] },
                parameters: [friendId, requiredTextQueryParameter("query", "Text used for retrieval and reranking.", "planned calls")],
                userScoped: true,
                badRequest: true,
                notFound: true,
            }),
        },
        "/friends/{id}/rebuild-search-index": {
            post: operation({
                tag: "Search",
                summary: "Rebuild a friend's search index",
                description: "Recreates searchable entries from the friend's notes, rules and events.",
                successStatus: "200",
                successDescription: "The index was rebuilt.",
                successSchema: "RebuildSearchIndexResponse",
                successExample: { message: "Search index rebuilt successfully", createdDocCount: 4 },
                parameters: [friendId],
                userScoped: true,
                badRequest: true,
                notFound: true,
            }),
        },
        "/friends/{friendId}/rules": {
            get: operation({
                tag: "Rules",
                summary: "List a friend's rules",
                description: "Returns rules for an active friend owned by the selected development user.",
                successStatus: "200",
                successDescription: "The friend's rules.",
                successSchema: "RulesResponse",
                successExample: { rules: [] },
                parameters: [friendIdParam],
                userScoped: true,
                badRequest: true,
                notFound: true,
            }),
            post: operation({
                tag: "Rules",
                summary: "Create a rule",
                description: "Creates a rule that describes how an event affects the friendship score.",
                successStatus: "201",
                successDescription: "The rule was created.",
                successSchema: "RuleResponse",
                parameters: [friendIdParam],
                body: {
                    schema: "CreateRuleBody",
                    example: {
                        title: "Unexpected calls",
                        description: "Cole dislikes calls without prior warning.",
                        impactDirection: "negative",
                        weight: "high",
                    },
                },
                userScoped: true,
                badRequest: true,
                notFound: true,
            }),
        },
        "/rules/{ruleId}/weight": {
            patch: operation({
                tag: "Rules",
                summary: "Update a rule weight",
                description: "Changes the impact weight of a rule owned by the selected development user.",
                successStatus: "200",
                successDescription: "The updated rule.",
                successSchema: "RuleResponse",
                parameters: [ruleId],
                body: { schema: "UpdateRuleWeightBody", example: { weight: "critical" } },
                userScoped: true,
                badRequest: true,
                notFound: true,
            }),
        },
        "/friends/{friendId}/events": {
            get: operation({
                tag: "Events",
                summary: "List a friend's events",
                description: "Returns events belonging to an active friend.",
                successStatus: "200",
                successDescription: "The friend's events.",
                successSchema: "EventsResponse",
                successExample: { events: [] },
                parameters: [friendIdParam],
                userScoped: true,
                badRequest: true,
                notFound: true,
            }),
            post: operation({
                tag: "Events",
                summary: "Record an event",
                description: "Records an event for an active friend.",
                successStatus: "201",
                successDescription: "The event was created.",
                successSchema: "EventResponse",
                parameters: [friendIdParam],
                body: {
                    schema: "CreateEventBody",
                    example: {
                        eventText: "I called Cole without prior warning.",
                        happenedAt: "2026-06-24T12:00:00.000Z",
                    },
                },
                userScoped: true,
                badRequest: true,
                notFound: true,
            }),
        },
        "/events/{eventId}": {
            get: operation({
                tag: "Events",
                summary: "Get an event",
                description: "Returns an event owned by the selected development user.",
                successStatus: "200",
                successDescription: "The event.",
                successSchema: "EventResponse",
                parameters: [eventId],
                userScoped: true,
                badRequest: true,
                notFound: true,
            }),
        },
        "/events/{eventId}/manual-assessment": {
            post: operation({
                tag: "Assessments",
                summary: "Create a manual assessment",
                description: "Stores a human-written score change for an event.",
                successStatus: "201",
                successDescription: "The assessment was created.",
                successSchema: "AssessmentResponse",
                parameters: [eventId],
                body: { schema: "ManualAssessmentBody", example: { scoreDelta: -3.5, reason: "The call was unexpected." } },
                userScoped: true,
                badRequest: true,
                notFound: true,
            }),
        },
        "/friends/{friendId}/balance": {
            get: operation({
                tag: "Assessments",
                summary: "Get a friendship balance",
                description: "Sums the assessment score changes for the friend's events.",
                successStatus: "200",
                successDescription: "The current balance.",
                successSchema: "FriendshipBalanceResponse",
                successExample: { friendId: "5da77ede-2290-4ede-9839-d83a29a310e6", balance: 9.5 },
                parameters: [friendIdParam],
                userScoped: true,
                badRequest: true,
                notFound: true,
            }),
        },
        "/events/{eventId}/mock-assessment": {
            post: assessmentOperation("Create a mock assessment", "Creates and stores an assessment without an external model call.", eventId),
        },
        "/events/{eventId}/mistral-assessment": {
            post: assessmentOperation("Create a Mistral assessment", "Creates and stores an assessment using Mistral.", eventId),
        },
        "/events/{eventId}/openai-assessment": {
            post: assessmentOperation("Create an OpenAI assessment", "Creates and stores an assessment using OpenAI.", eventId),
        },
        "/friends/{friendId}/predict": {
            post: predictionOperation("Create a mock prediction", "Evaluates a hypothetical action without saving an event or assessment.", friendIdParam, "PredictionResponse"),
        },
        "/friends/{friendId}/predict/mistral": {
            post: predictionOperation("Create a Mistral prediction", "Evaluates a hypothetical action with Mistral without saving an event or assessment.", friendIdParam, "MistralPredictionResponse"),
        },
        "/friends/{friendId}/facts": {
            get: operation({
                tag: "Person facts",
                summary: "List facts about a friend",
                description: "Returns facts about the person linked to an active friend.",
                successStatus: "200",
                successDescription: "The person's facts.",
                successSchema: "PersonFactsResponse",
                successExample: { facts: [] },
                parameters: [friendIdParam],
                userScoped: true,
                badRequest: true,
                notFound: true,
            }),
            post: operation({
                tag: "Person facts",
                summary: "Add a fact about a friend",
                description: "Adds a fact about the person linked to an active friend.",
                successStatus: "201",
                successDescription: "The fact was created.",
                successSchema: "PersonFactResponse",
                parameters: [friendIdParam],
                body: {
                    schema: "CreatePersonFactBody",
                    example: { content: "Cole prefers planned calls.", sourceType: "manual" },
                },
                userScoped: true,
                badRequest: true,
                notFound: true,
            }),
        },
        "/person-facts/{factId}/verification-status": {
            patch: operation({
                tag: "Person facts",
                summary: "Update a fact's verification status",
                description: "Changes the verification status of an accessible person fact.",
                successStatus: "200",
                successDescription: "The updated fact.",
                successSchema: "PersonFactResponse",
                parameters: [factId],
                body: {
                    schema: "UpdatePersonFactVerificationStatusBody",
                    example: { verificationStatus: "verified_by_target" },
                },
                userScoped: true,
                badRequest: true,
                notFound: true,
            }),
        },
        "/friends/{friendId}/intake-submissions": {
            post: operation({
                tag: "Knowledge intake",
                summary: "Submit knowledge intake answers",
                description: "Stores answers about the person linked to an active friend.",
                successStatus: "201",
                successDescription: "The submission and answers were stored.",
                successSchema: "KnowledgeIntakeSubmissionResponse",
                parameters: [friendIdParam],
                body: {
                    schema: "CreateKnowledgeIntakeSubmissionBody",
                    example: {
                        submittedByType: "target_person",
                        sourceType: "api",
                        answers: [{
                            questionKey: "communication.calls",
                            questionText: "How do you feel about phone calls?",
                            answerText: "I prefer scheduled calls.",
                        }],
                    },
                },
                userScoped: true,
                badRequest: true,
                notFound: true,
            }),
        },
        "/friends/{friendId}/documents/ingest": {
            post: operation({
                tag: "Search and RAG",
                summary: "Ingest a text document",
                description: "Stores TXT or Markdown content as searchable chunks for an active friend.",
                successStatus: "201",
                successDescription: "The document was ingested.",
                successSchema: "DocumentIngestionResponse",
                successExample: {
                    friendId: "5da77ede-2290-4ede-9839-d83a29a310e6",
                    documentId: "a3b2c1d0-1d2c-4b3a-8f6e-7d8c9b0a1e2f",
                    title: "Relationship notes",
                    documentType: "markdown",
                    createdChunkCount: 1,
                    sourceIds: ["b4c3d2e1-2e3d-4c4b-9a7f-8e9d0c1b2a3f"],
                },
                parameters: [friendIdParam],
                body: {
                    schema: "IngestDocumentBody",
                    example: {
                        title: "Relationship notes",
                        documentType: "markdown",
                        content: "Cole prefers planned calls.",
                        sourceDate: "2026-06-24",
                    },
                },
                userScoped: true,
                badRequest: true,
                notFound: true,
            }),
        },
        "/search-documents/embed-missing": {
            post: operation({
                tag: "Search and RAG",
                summary: "Embed documents without embeddings",
                description: "Generates embeddings for indexed documents that do not have one. This route does not check the caller's identity and should be protected by the deployment boundary.",
                successStatus: "200",
                successDescription: "The number of documents embedded.",
                successSchema: "EmbedMissingResponse",
                successExample: { embeddedCount: 12 },
            }),
        },
    };

    return {
        openapi: "3.1.0",
        info: {
            title: "Friendship Points API",
            version: "1.0.0",
            description: "The optional `x-user-id` header selects a development user for owner-scoped routes. It is not authentication. When omitted the API uses a seeded development user. The embedding maintenance route has no user check.",
        },
        servers: [{ url: "http://localhost:3000", description: "Local development" }],
        tags: [
            { name: "Health" },
            { name: "Friends" },
            { name: "Rules" },
            { name: "Events" },
            { name: "Assessments" },
            { name: "Person facts" },
            { name: "Knowledge intake" },
            { name: "Search" },
            { name: "Search and RAG" },
        ],
        paths,
        components: { schemas: components },
    };
}

/** Describes one LLM assessment endpoint. */
function assessmentOperation(summary: string, description: string, parameter: Parameter): JsonSchema {
    return operation({
        tag: "Assessments",
        summary,
        description,
        successStatus: "201",
        successDescription: "The assessment was created.",
        successSchema: "AssessmentWithContextResponse",
        parameters: [parameter],
        userScoped: true,
        badRequest: true,
        notFound: true,
    });
}

/** Describes a prediction endpoint and its hypothetical-action body. */
function predictionOperation(summary: string, description: string, parameter: Parameter, responseSchema: string): JsonSchema {
    return operation({
        tag: "Assessments",
        summary,
        description,
        successStatus: "200",
        successDescription: "The prediction and retrieved context.",
        successSchema: responseSchema,
        parameters: [parameter],
        body: {
            schema: "PredictFriendActionBody",
            example: { hypotheticalAction: "I call Cole without warning tomorrow." },
        },
        userScoped: true,
        badRequest: true,
        notFound: true,
    });
}
