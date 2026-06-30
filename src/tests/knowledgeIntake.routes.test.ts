import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/friends.service.js", () => ({
    getFriendById: vi.fn(),
}));

vi.mock("../services/personFacts.service.js", () => ({
    getPersonIdForUser: vi.fn(),
}));

vi.mock("../services/knowledgeIntake.service.js", () => ({
    createKnowledgeIntakeSubmission: vi.fn(),
}));

import { DEFAULT_DEV_USER_ID } from "../services/currentUser.service.js";
import { getFriendById } from "../services/friends.service.js";
import { createKnowledgeIntakeSubmission } from "../services/knowledgeIntake.service.js";
import { getPersonIdForUser } from "../services/personFacts.service.js";
import { knowledgeIntakeRoutes } from "../routes/knowledgeIntake.routes.js";

const friendId = "5da77ede-2290-4ede-9839-d83a29a310e6";
const targetPersonId = "11111111-1111-4111-8111-111111111111";
const ownerPersonId = "22222222-2222-4222-8222-222222222222";

const existingFriend: NonNullable<Awaited<ReturnType<typeof getFriendById>>> = {
    id: friendId,
    ownerUserId: DEFAULT_DEV_USER_ID,
    targetPersonId,
    displayName: "Cole",
    notes: null,
    createdAt: new Date("2026-06-01T00:00:00.000Z"),
    updatedAt: new Date("2026-06-01T00:00:00.000Z"),
    deletedAt: null,
};

const createdSubmission: Awaited<
    ReturnType<typeof createKnowledgeIntakeSubmission>
> = {
    id: "33333333-3333-4333-8333-333333333333",
    friendId,
    targetPersonId,
    submittedByPersonId: targetPersonId,
    submittedByType: "target_person",
    sourceType: "api",
    createdAt: new Date("2026-06-30T00:00:00.000Z"),
    updatedAt: new Date("2026-06-30T00:00:00.000Z"),
    answers: [
        {
            id: "44444444-4444-4444-8444-444444444444",
            submissionId: "33333333-3333-4333-8333-333333333333",
            questionKey: "communication.calls",
            questionText: "How do you feel about phone calls?",
            answerText: "I prefer scheduled calls.",
            createdAt: new Date("2026-06-30T00:00:00.000Z"),
            updatedAt: new Date("2026-06-30T00:00:00.000Z"),
        },
    ],
};

const mockedGetFriendById = vi.mocked(getFriendById);
const mockedGetPersonIdForUser = vi.mocked(getPersonIdForUser);
const mockedCreateKnowledgeIntakeSubmission = vi.mocked(
    createKnowledgeIntakeSubmission,
);

describe("knowledgeIntakeRoutes", () => {
    let app: FastifyInstance;

    beforeEach(() => {
        vi.clearAllMocks();
        app = Fastify();
        app.register(knowledgeIntakeRoutes);

        mockedGetFriendById.mockResolvedValue(existingFriend);
        mockedGetPersonIdForUser.mockResolvedValue(ownerPersonId);
        mockedCreateKnowledgeIntakeSubmission.mockResolvedValue(
            createdSubmission,
        );
    });

    afterEach(async () => {
        await app.close();
    });

    it("creates a target-person intake submission for a friend's target person", async () => {
        const response = await app.inject({
            method: "POST",
            url: `/friends/${friendId}/intake-submissions`,
            payload: {
                submittedByType: "target_person",
                answers: [
                    {
                        questionKey: "communication.calls",
                        questionText: "How do you feel about phone calls?",
                        answerText: "I prefer scheduled calls.",
                    },
                ],
            },
        });

        expect(response.statusCode).toBe(201);
        expect(response.json()).toEqual({
            submission: {
                ...createdSubmission,
                createdAt: createdSubmission.createdAt.toISOString(),
                updatedAt: createdSubmission.updatedAt.toISOString(),
                answers: createdSubmission.answers.map((answer) => ({
                    ...answer,
                    createdAt: answer.createdAt.toISOString(),
                    updatedAt: answer.updatedAt.toISOString(),
                })),
            },
        });
        expect(mockedGetFriendById).toHaveBeenCalledWith(
            friendId,
            DEFAULT_DEV_USER_ID,
        );
        expect(mockedCreateKnowledgeIntakeSubmission).toHaveBeenCalledWith({
            friendId,
            targetPersonId,
            submittedByType: "target_person",
            submittedByPersonId: targetPersonId,
            sourceType: "api",
            answers: [
                {
                    questionKey: "communication.calls",
                    questionText: "How do you feel about phone calls?",
                    answerText: "I prefer scheduled calls.",
                },
            ],
        });
    });

    it("uses the current user's person for owner-user submissions", async () => {
        await app.inject({
            method: "POST",
            url: `/friends/${friendId}/intake-submissions`,
            payload: {
                submittedByType: "owner_user",
                answers: [
                    {
                        questionKey: "hobbies",
                        questionText: "What hobbies should people know about?",
                        answerText: "Rock climbing.",
                    },
                ],
            },
        });

        expect(mockedCreateKnowledgeIntakeSubmission).toHaveBeenCalledWith(
            expect.objectContaining({
                submittedByType: "owner_user",
                submittedByPersonId: ownerPersonId,
            }),
        );
    });

    it("returns 400 when the body is invalid", async () => {
        const response = await app.inject({
            method: "POST",
            url: `/friends/${friendId}/intake-submissions`,
            payload: {
                submittedByType: "target_person",
                answers: [],
            },
        });

        expect(response.statusCode).toBe(400);
        expect(mockedCreateKnowledgeIntakeSubmission).not.toHaveBeenCalled();
    });

    it("returns 404 when the friend is missing or not owned by the user", async () => {
        mockedGetFriendById.mockResolvedValue(null);

        const response = await app.inject({
            method: "POST",
            url: `/friends/${friendId}/intake-submissions`,
            payload: {
                submittedByType: "target_person",
                answers: [
                    {
                        questionKey: "communication.calls",
                        questionText: "How do you feel about phone calls?",
                        answerText: "I prefer scheduled calls.",
                    },
                ],
            },
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toEqual({ error: "Friend not found" });
        expect(mockedCreateKnowledgeIntakeSubmission).not.toHaveBeenCalled();
    });

    it("returns 400 when owner-user submissions have no current user person", async () => {
        mockedGetPersonIdForUser.mockResolvedValue(null);

        const response = await app.inject({
            method: "POST",
            url: `/friends/${friendId}/intake-submissions`,
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

        expect(response.statusCode).toBe(400);
        expect(response.json()).toEqual({
            error: "Current user is not linked to a person.",
        });
        expect(mockedCreateKnowledgeIntakeSubmission).not.toHaveBeenCalled();
    });
});
