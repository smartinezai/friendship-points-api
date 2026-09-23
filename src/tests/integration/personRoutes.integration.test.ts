import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import { prisma } from "../../db/prisma.js";
import { createTestUser } from "./factories.js";
import { cleanUpTestUser } from "./testDatabase.js";

let ownerUserId = "";

function requestHeaders() {
    return { "x-user-id": ownerUserId };
}

async function createFriend(): Promise<{ id: string }> {
    const response = await app.inject({
        method: "POST",
        url: "/friends",
        headers: requestHeaders(),
        payload: { displayName: "Cole" },
    });

    expect(response.statusCode).toBe(201);
    return response.json<{ friend: { id: string } }>().friend;
}

describe("person and intake routes with PostgreSQL", () => {
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

    it("stores person facts and intake answers with their source records", async () => {
        const friend = await createFriend();

        const factResponse = await app.inject({
            method: "POST",
            url: `/friends/${friend.id}/facts`,
            headers: requestHeaders(),
            payload: { content: "Cole prefers calls planned in advance." },
        });

        expect(factResponse.statusCode).toBe(201);
        const fact = factResponse.json<{
            fact: { id: string; verificationStatus: string; sourceType: string };
        }>().fact;
        expect(fact).toMatchObject({
            verificationStatus: "unverified_third_party",
            sourceType: "manual",
        });

        const intakeResponse = await app.inject({
            method: "POST",
            url: `/friends/${friend.id}/intake-submissions`,
            headers: requestHeaders(),
            payload: {
                submittedByType: "owner_user",
                answers: [
                    {
                        questionKey: "communication.calls",
                        questionText: "How do you feel about phone calls?",
                        answerText: "I prefer scheduled calls.",
                    },
                ],
            },
        });

        expect(intakeResponse.statusCode).toBe(201);
        const submission = intakeResponse.json<{
            submission: {
                id: string;
                answers: Array<{ questionKey: string; answerText: string }>;
            } & Record<string, unknown>;
        }>().submission;
        expect(submission.answers).toEqual([
            expect.objectContaining({
                questionKey: "communication.calls",
                answerText: "I prefer scheduled calls.",
            }),
        ]);
        expect(submission).not.toHaveProperty("friendId");
        expect(submission).not.toHaveProperty("targetPersonId");
        expect(submission).not.toHaveProperty("submittedByPersonId");
        expect(submission.answers[0]).not.toHaveProperty("submissionId");

        const storedSubmission = await prisma.knowledgeIntakeSubmission.findUnique({
            where: { id: submission.id },
            include: { answers: true },
        });
        expect(storedSubmission?.answers).toHaveLength(1);

        const factsResponse = await app.inject({
            method: "GET",
            url: `/friends/${friend.id}/facts`,
            headers: requestHeaders(),
        });
        expect(factsResponse.statusCode).toBe(200);
        expect(factsResponse.json<{ facts: Array<{ id: string }> }>().facts.map(
            ({ id }) => id,
        )).toEqual(expect.arrayContaining([fact.id]));
    });
});
