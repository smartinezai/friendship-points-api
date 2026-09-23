import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import { prisma } from "../../db/prisma.js";
import {
    createTestEvent,
    createTestFriend,
    createTestSearchableDocument,
    createTestUser,
} from "./factories.js";
import { cleanUpTestUser } from "./testDatabase.js";

let ownerUserId = "";

function requestHeaders() {
    return { "x-user-id": ownerUserId };
}

describe("retrieval-backed assessment and prediction routes", () => {
    beforeEach(async () => {
        const user = await createTestUser();
        ownerUserId = user.id;
    });

    afterEach(async () => {
        await cleanUpTestUser(ownerUserId);
    });

    afterAll(async () => {
        await app.close();
        await prisma.$disconnect();
    });

    it("uses stored context and keeps hypothetical predictions out of history", async () => {
        const friend = await createTestFriend({ ownerUserId, displayName: "Cole" });
        const event = await createTestEvent({
            friendId: friend.id,
            eventText: "I made an unexpected phone call to Cole.",
        });
        const context = await createTestSearchableDocument({
            friendId: friend.id,
            content: "Cole dislikes an unexpected phone call.",
        });

        const assessmentResponse = await app.inject({
            method: "POST",
            url: `/events/${event.id}/mock-assessment`,
            headers: requestHeaders(),
        });
        expect(assessmentResponse.statusCode).toBe(201);
        const assessmentResult = assessmentResponse.json<{
            assessment: { source: string; scoreDelta: number };
            retrievedContext: Array<{ sourceId: string }>;
        }>();
        expect(assessmentResult.assessment).toMatchObject({
            source: "mock",
            scoreDelta: 10,
        });
        expect(assessmentResult.retrievedContext.map(({ sourceId }) => sourceId)).toEqual([
            context.sourceId,
        ]);

        const predictionResponse = await app.inject({
            method: "POST",
            url: `/friends/${friend.id}/predict`,
            headers: requestHeaders(),
            payload: { hypotheticalAction: "Make an unexpected phone call." },
        });
        expect(predictionResponse.statusCode).toBe(200);
        const prediction = predictionResponse.json<{
            saved: boolean;
            retrievedContext: Array<{ sourceId: string }>;
        }>();
        expect(prediction.saved).toBe(false);
        expect(prediction.retrievedContext.map(({ sourceId }) => sourceId)).toEqual([
            context.sourceId,
        ]);
        expect(
            await prisma.assessment.count({ where: { eventId: event.id } }),
        ).toBe(1);
    });
});
