import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/friends.service.js", () => ({
    getFriendById: vi.fn(),
}));

vi.mock("../services/personFacts.service.js", () => ({
    createPersonFact: vi.fn(),
    getAccessiblePersonFact: vi.fn(),
    getPersonIdForUser: vi.fn(),
    listPersonFactsForTarget: vi.fn(),
    updatePersonFactVerificationStatus: vi.fn(),
}));

import { DEFAULT_DEV_USER_ID } from "../services/currentUser.service.js";
import { getFriendById } from "../services/friends.service.js";
import {
    createPersonFact,
    getAccessiblePersonFact,
    getPersonIdForUser,
    listPersonFactsForTarget,
    updatePersonFactVerificationStatus,
} from "../services/personFacts.service.js";
import { personFactsRoutes } from "../routes/personFacts.routes.js";

const friendId = "5da77ede-2290-4ede-9839-d83a29a310e6";
const targetPersonId = "11111111-1111-4111-8111-111111111111";
const authorPersonId = "22222222-2222-4222-8222-222222222222";

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

const createdFact: Awaited<ReturnType<typeof createPersonFact>> = {
    id: "33333333-3333-4333-8333-333333333333",
    targetPersonId,
    authorPersonId,
    content: "Cole prefers planned calls.",
    verificationStatus: "unverified_third_party",
    sourceType: "manual",
    sourceId: null,
    createdAt: new Date("2026-06-28T00:00:00.000Z"),
    updatedAt: new Date("2026-06-28T00:00:00.000Z"),
};

const mockedGetFriendById = vi.mocked(getFriendById);
const mockedGetPersonIdForUser = vi.mocked(getPersonIdForUser);
const mockedCreatePersonFact = vi.mocked(createPersonFact);
const mockedGetAccessiblePersonFact = vi.mocked(getAccessiblePersonFact);
const mockedListPersonFactsForTarget = vi.mocked(listPersonFactsForTarget);
const mockedUpdatePersonFactVerificationStatus = vi.mocked(
    updatePersonFactVerificationStatus,
);

describe("personFactsRoutes", () => {
    let app: FastifyInstance;

    beforeEach(() => {
        vi.clearAllMocks();
        app = Fastify();
        app.register(personFactsRoutes);

        mockedGetFriendById.mockResolvedValue(existingFriend);
        mockedGetPersonIdForUser.mockResolvedValue(authorPersonId);
        mockedCreatePersonFact.mockResolvedValue(createdFact);
        mockedGetAccessiblePersonFact.mockResolvedValue(createdFact);
        mockedListPersonFactsForTarget.mockResolvedValue([createdFact]);
        mockedUpdatePersonFactVerificationStatus.mockResolvedValue({
            ...createdFact,
            verificationStatus: "verified_by_target",
        });
    });

    afterEach(async () => {
        await app.close();
    });

    it("lists facts for the tracked friend's target person", async () => {
        const response = await app.inject({
            method: "GET",
            url: `/friends/${friendId}/facts`,
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
            facts: [
                {
                    ...createdFact,
                    createdAt: createdFact.createdAt.toISOString(),
                    updatedAt: createdFact.updatedAt.toISOString(),
                },
            ],
        });
        expect(mockedGetFriendById).toHaveBeenCalledWith(
            friendId,
            DEFAULT_DEV_USER_ID,
        );
        expect(mockedListPersonFactsForTarget).toHaveBeenCalledWith(
            targetPersonId,
        );
    });

    it("creates a fact for the tracked friend's target person", async () => {
        const response = await app.inject({
            method: "POST",
            url: `/friends/${friendId}/facts`,
            payload: {
                content: "  Cole prefers planned calls.  ",
            },
        });

        expect(response.statusCode).toBe(201);
        expect(response.json()).toEqual({
            fact: {
                ...createdFact,
                createdAt: createdFact.createdAt.toISOString(),
                updatedAt: createdFact.updatedAt.toISOString(),
            },
        });
        expect(mockedGetFriendById).toHaveBeenCalledWith(
            friendId,
            DEFAULT_DEV_USER_ID,
        );
        expect(mockedGetPersonIdForUser).toHaveBeenCalledWith(
            DEFAULT_DEV_USER_ID,
        );
        expect(mockedCreatePersonFact).toHaveBeenCalledWith({
            friendId,
            targetPersonId,
            authorPersonId,
            content: "Cole prefers planned calls.",
            sourceType: "manual",
        });
    });

    it("returns 400 when the request body is invalid", async () => {
        const response = await app.inject({
            method: "POST",
            url: `/friends/${friendId}/facts`,
            payload: {
                content: "",
            },
        });

        expect(response.statusCode).toBe(400);
        expect(mockedCreatePersonFact).not.toHaveBeenCalled();
    });

    it("returns 404 when the friend is missing or not owned by the user", async () => {
        mockedGetFriendById.mockResolvedValue(null);

        const response = await app.inject({
            method: "POST",
            url: `/friends/${friendId}/facts`,
            payload: {
                content: "Cole prefers planned calls.",
            },
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toEqual({ error: "Friend not found" });
        expect(mockedCreatePersonFact).not.toHaveBeenCalled();
    });

    it("returns 400 when the current user has no person profile", async () => {
        mockedGetPersonIdForUser.mockResolvedValue(null);

        const response = await app.inject({
            method: "POST",
            url: `/friends/${friendId}/facts`,
            payload: {
                content: "Cole prefers planned calls.",
            },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toEqual({
            error: "Current user is not linked to a person.",
        });
        expect(mockedCreatePersonFact).not.toHaveBeenCalled();
    });

    it("updates a fact verification status", async () => {
        const response = await app.inject({
            method: "PATCH",
            url: `/person-facts/${createdFact.id}/verification-status`,
            payload: {
                verificationStatus: "verified_by_target",
            },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
            fact: {
                ...createdFact,
                verificationStatus: "verified_by_target",
                createdAt: createdFact.createdAt.toISOString(),
                updatedAt: createdFact.updatedAt.toISOString(),
            },
        });
        expect(mockedGetAccessiblePersonFact).toHaveBeenCalledWith(
            createdFact.id,
            DEFAULT_DEV_USER_ID,
        );
        expect(mockedUpdatePersonFactVerificationStatus).toHaveBeenCalledWith({
            factId: createdFact.id,
            verificationStatus: "verified_by_target",
        });
    });

    it("returns 400 when the verification status is invalid", async () => {
        const response = await app.inject({
            method: "PATCH",
            url: `/person-facts/${createdFact.id}/verification-status`,
            payload: {
                verificationStatus: "rumor",
            },
        });

        expect(response.statusCode).toBe(400);
        expect(mockedUpdatePersonFactVerificationStatus).not.toHaveBeenCalled();
    });

    it("returns 404 when the fact is not accessible to the user", async () => {
        mockedGetAccessiblePersonFact.mockResolvedValue(null);

        const response = await app.inject({
            method: "PATCH",
            url: `/person-facts/${createdFact.id}/verification-status`,
            payload: {
                verificationStatus: "rejected_by_target",
            },
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toEqual({ error: "Person fact not found" });
        expect(mockedUpdatePersonFactVerificationStatus).not.toHaveBeenCalled();
    });
});
