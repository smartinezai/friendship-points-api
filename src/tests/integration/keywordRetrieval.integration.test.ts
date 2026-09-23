import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import { prisma } from "../../db/prisma.js";
import { retrieveFriendContext } from "../../services/search.service.js";
import {
    createTestEvent,
    createTestFriend,
    createTestPersonFact,
    createTestRule,
    createTestSearchableDocument,
    createTestUser,
} from "./factories.js";
import { cleanUpTestUser } from "./testDatabase.js";

let ownerUserId = "";
let ownerPersonId = "";

function requestHeaders() {
    return { "x-user-id": ownerUserId };
}

describe("keyword retrieval routes with PostgreSQL", () => {
    beforeEach(async () => {
        const user = await createTestUser();
        ownerUserId = user.id;
        ownerPersonId = user.personId ?? "";
    });

    afterEach(async () => {
        await cleanUpTestUser(ownerUserId);
    });

    afterAll(async () => {
        await app.close();
        await prisma.$disconnect();
    });

    it("returns keyword results in score order and limits direct retrieval", async () => {
        const friend = await createTestFriend({
            ownerUserId,
            displayName: "Cole",
        });
        const fact = await createTestPersonFact({
            targetPersonId: friend.targetPersonId,
            authorPersonId: ownerPersonId,
            content: "Cole prefers a planned phone call.",
        });
        const highScoreEvent = await createTestEvent({
            friendId: friend.id,
            eventText: "Cole discussed the planned call.",
        });
        const lowerScoreEvent = await createTestEvent({
            friendId: friend.id,
            eventText: "Cole had a call today.",
        });

        await createTestSearchableDocument({
            friendId: friend.id,
            sourceType: "person_fact",
            sourceId: fact.id,
            content: fact.content,
        });
        await createTestSearchableDocument({
            friendId: friend.id,
            sourceType: "event",
            sourceId: highScoreEvent.id,
            content: highScoreEvent.eventText,
        });
        await createTestSearchableDocument({
            friendId: friend.id,
            sourceType: "event",
            sourceId: lowerScoreEvent.id,
            content: lowerScoreEvent.eventText,
        });

        const limitedResults = await retrieveFriendContext(
            friend.id,
            "planned phone call",
            { limit: 1 },
        );
        expect(limitedResults).toHaveLength(1);
        expect(limitedResults[0]?.sourceId).toBe(fact.id);

        const response = await app.inject({
            method: "GET",
            url: `/friends/${friend.id}/search-context?query=planned%20phone%20call`,
            headers: requestHeaders(),
        });

        expect(response.statusCode).toBe(200);
        const results = response.json<{
            results: Array<{ sourceId: string; score: number }>;
        }>().results;
        expect(results.map(({ sourceId }) => sourceId)).toEqual([
            fact.id,
            highScoreEvent.id,
            lowerScoreEvent.id,
        ]);
        expect(results.map(({ score }) => score)).toEqual([3, 2, 1]);
    });

    it("returns an empty list for no matches and rejects empty queries", async () => {
        const friend = await createTestFriend({
            ownerUserId,
            displayName: "Cole",
        });
        await createTestSearchableDocument({
            friendId: friend.id,
            content: "Cole likes quiet evenings.",
        });

        const noMatchesResponse = await app.inject({
            method: "GET",
            url: `/friends/${friend.id}/search-context?query=mountain%20biking`,
            headers: requestHeaders(),
        });

        expect(noMatchesResponse.statusCode).toBe(200);
        expect(noMatchesResponse.json()).toEqual({ results: [] });

        const emptyQueryResponse = await app.inject({
            method: "GET",
            url: `/friends/${friend.id}/search-context?query=`,
            headers: requestHeaders(),
        });

        expect(emptyQueryResponse.statusCode).toBe(400);
    });

    it("returns 404 for missing friends and excludes deleted friends from retrieval", async () => {
        const friend = await createTestFriend({
            ownerUserId,
            displayName: "Cole",
        });

        const missingFriendResponse = await app.inject({
            method: "GET",
            url: "/friends/11111111-1111-4111-8111-111111111111/search-context?query=phone",
            headers: requestHeaders(),
        });
        expect(missingFriendResponse.statusCode).toBe(404);

        const deleteResponse = await app.inject({
            method: "DELETE",
            url: `/friends/${friend.id}`,
            headers: requestHeaders(),
        });
        expect(deleteResponse.statusCode).toBe(200);

        const deletedFriendResponse = await app.inject({
            method: "GET",
            url: `/friends/${friend.id}/search-context?query=phone`,
            headers: requestHeaders(),
        });
        expect(deletedFriendResponse.statusCode).toBe(404);
    });

    it("rebuilds search documents from current context with valid source IDs", async () => {
        const friend = await createTestFriend({
            ownerUserId,
            displayName: "Cole",
            notes: "Cole likes calls planned in advance.",
        });
        const rule = await createTestRule({
            friendId: friend.id,
            title: "Call first",
            description: "Ask before making an unexpected call.",
        });
        const event = await createTestEvent({
            friendId: friend.id,
            eventText: "I called Cole without warning.",
        });

        const response = await app.inject({
            method: "POST",
            url: `/friends/${friend.id}/rebuild-search-index`,
            headers: requestHeaders(),
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
            message: "Search index rebuilt successfully",
            createdDocCount: 3,
        });

        const documents = await prisma.searchableDocument.findMany({
            where: { friendId: friend.id },
            select: { sourceType: true, sourceId: true },
        });
        expect(documents).toEqual(
            expect.arrayContaining([
                { sourceType: "friend_note", sourceId: friend.id },
                { sourceType: "rule", sourceId: rule.id },
                { sourceType: "event", sourceId: event.id },
            ]),
        );
    });
});
