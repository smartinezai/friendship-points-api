import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/embeddings.service.js", async (importOriginal) => {
    const actual = await importOriginal<
        typeof import("../../services/embeddings.service.js")
    >();

    return {
        ...actual,
        createEmbedding: vi.fn(),
    };
});

import app from "../../app.js";
import { prisma } from "../../db/prisma.js";
import {
    createEmbedding,
    formatVectorForSql,
} from "../../services/embeddings.service.js";
import {
    createTestEvent,
    createTestFriend,
    createTestRule,
    createTestSearchableDocument,
    createTestUser,
} from "./factories.js";
import { cleanUpTestUser } from "./testDatabase.js";

const embeddingDimensions = 1024;
let ownerUserId = "";
let originalMistralApiKey: string | undefined;
const mockedCreateEmbedding = vi.mocked(createEmbedding);

function requestHeaders() {
    return { "x-user-id": ownerUserId };
}

function makeEmbedding(activeIndex: number): number[] {
    const embedding = Array.from({ length: embeddingDimensions }, () => 0);
    embedding[activeIndex] = 1;
    return embedding;
}

async function setDocumentEmbedding(
    searchableDocumentId: string,
    embedding: number[],
): Promise<void> {
    const formattedEmbedding = formatVectorForSql(embedding);

    await prisma.$executeRaw`
        UPDATE "SearchableDocument"
        SET "embedding" = ${formattedEmbedding}::vector
        WHERE "id" = ${searchableDocumentId}
    `;
}

describe("semantic retrieval routes with pgvector", () => {
    beforeEach(async () => {
        mockedCreateEmbedding.mockReset();
        originalMistralApiKey = process.env.MISTRAL_API_KEY;
        const user = await createTestUser();
        ownerUserId = user.id;
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        if (originalMistralApiKey === undefined) {
            delete process.env.MISTRAL_API_KEY;
        } else {
            process.env.MISTRAL_API_KEY = originalMistralApiKey;
        }
        await cleanUpTestUser(ownerUserId);
    });

    afterAll(async () => {
        await app.close();
        await prisma.$disconnect();
    });

    it("orders semantic results in pgvector then reranks by relevance", async () => {
        const friend = await createTestFriend({
            ownerUserId,
            displayName: "Cole",
        });
        const event = await createTestEvent({
            friendId: friend.id,
            eventText: "Cole prefers a scheduled phone call.",
        });
        const rule = await createTestRule({
            friendId: friend.id,
            title: "Concerts",
            description: "Cole enjoys crowded concerts.",
        });
        const relevantDocument = await createTestSearchableDocument({
            friendId: friend.id,
            sourceType: "event",
            sourceId: event.id,
            content: event.eventText,
        });
        const unrelatedDocument = await createTestSearchableDocument({
            friendId: friend.id,
            sourceType: "rule",
            sourceId: rule.id,
            content: `${rule.title} ${rule.description}`,
        });
        const queryEmbedding = makeEmbedding(0);
        await setDocumentEmbedding(relevantDocument.id, queryEmbedding);
        await setDocumentEmbedding(unrelatedDocument.id, makeEmbedding(1));
        mockedCreateEmbedding.mockResolvedValue(queryEmbedding);

        const semanticResponse = await app.inject({
            method: "GET",
            url: `/friends/${friend.id}/search-context/semantic?query=scheduled%20phone%20call`,
            headers: requestHeaders(),
        });

        expect(semanticResponse.statusCode).toBe(200);
        const semanticResults = semanticResponse.json<{
            results: Array<{ sourceId: string; distance: number }>;
        }>().results;
        expect(semanticResults.map(({ sourceId }) => sourceId)).toEqual([
            event.id,
            rule.id,
        ]);
        expect(semanticResults[0]?.distance).toBeCloseTo(0);

        const rerankedResponse = await app.inject({
            method: "GET",
            url: `/friends/${friend.id}/search-context/reranked?query=scheduled%20phone%20call`,
            headers: requestHeaders(),
        });

        expect(rerankedResponse.statusCode).toBe(200);
        const reranked = rerankedResponse.json<{
            semanticResults: Array<{ sourceId: string }>;
            rerankedResults: Array<{ sourceId: string; rerankScore: number }>;
        }>();
        expect(reranked.semanticResults[0]?.sourceId).toBe(event.id);
        expect(reranked.rerankedResults[0]?.sourceId).toBe(event.id);
    });

    it("stores embeddings using a local HTTP response", async () => {
        const friend = await createTestFriend({
            ownerUserId,
            displayName: "Cole",
        });
        const document = await createTestSearchableDocument({
            friendId: friend.id,
            content: "A document that needs an embedding.",
        });
        const embedding = makeEmbedding(0);
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(
                JSON.stringify({ data: [{ embedding }] }),
                { status: 200, headers: { "Content-Type": "application/json" } },
            ),
        );
        vi.stubGlobal("fetch", fetchMock);
        process.env.MISTRAL_API_KEY = "integration-test-key";

        const response = await app.inject({
            method: "POST",
            url: "/search-documents/embed-missing",
            headers: requestHeaders(),
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({ embeddedCount: 1 });
        expect(fetchMock).toHaveBeenCalledOnce();
        expect(fetchMock.mock.calls[0]?.[0]).toBe(
            "https://api.mistral.ai/v1/embeddings",
        );

        const storedRows = await prisma.$queryRaw<
            { hasEmbedding: boolean }[]
        >`
            SELECT "embedding" IS NOT NULL AS "hasEmbedding"
            FROM "SearchableDocument"
            WHERE "id" = ${document.id}
        `;
        expect(storedRows[0]?.hasEmbedding).toBe(true);
    });
});
