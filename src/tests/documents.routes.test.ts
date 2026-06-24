import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/friends.service.js", () => ({
    getFriendById: vi.fn(),
}));

vi.mock("../services/documentIngestion/ingestFriendDocument.service.js", () => ({
    ingestFriendDocument: vi.fn(),
}));

import { documentsRoutes } from "../routes/documents.routes.js";
import { getFriendById } from "../services/friends.service.js";
import { ingestFriendDocument } from "../services/documentIngestion/ingestFriendDocument.service.js";

const friendId = "5da77ede-2290-4ede-9839-d83a29a310e6";

const existingFriend: NonNullable<
    Awaited<ReturnType<typeof getFriendById>>
> = {
    id: friendId,
    displayName: "Cole",
    notes: null,
    createdAt: new Date("2026-06-01T00:00:00.000Z"),
    updatedAt: new Date("2026-06-01T00:00:00.000Z"),
    deletedAt: null,
};

const ingestionResult: Awaited<ReturnType<typeof ingestFriendDocument>> = {
    friendId,
    documentId: "a3b2c1d0-1d2c-4b3a-8f6e-7d8c9b0a1e2f",
    title: "Relationship notes",
    documentType: "markdown",
    createdChunkCount: 1,
    sourceIds: ["b4c3d2e1-2e3d-4c4b-9a7f-8e9d0c1b2a3f"],
};

const mockedGetFriendById = vi.mocked(getFriendById);
const mockedIngestFriendDocument = vi.mocked(ingestFriendDocument);

describe("documentsRoutes", () => {
    let app: FastifyInstance;

    beforeEach(() => {
        vi.clearAllMocks();
        app = Fastify();
        app.register(documentsRoutes);

        mockedGetFriendById.mockResolvedValue(existingFriend);
        mockedIngestFriendDocument.mockResolvedValue(ingestionResult);
    });

    afterEach(async () => {
        await app.close();
    });

    it("ingests a valid document and returns its ingestion summary", async () => {
        const response = await app.inject({
            method: "POST",
            url: `/friends/${friendId}/documents/ingest`,
            payload: {
                title: "  Relationship notes  ",
                documentType: "markdown",
                content: "  ## Communication\nCole prefers planned calls.  ",
                sourceDate: "2026-06-24",
            },
        });

        expect(response.statusCode).toBe(201);
        expect(response.json()).toEqual(ingestionResult);
        expect(mockedGetFriendById).toHaveBeenCalledWith(friendId);
        expect(mockedIngestFriendDocument).toHaveBeenCalledWith({
            friendId,
            title: "Relationship notes",
            documentType: "markdown",
            content: "## Communication\nCole prefers planned calls.",
            sourceDate: new Date("2026-06-24T00:00:00.000Z"),
            maxChunkCharacters: 1500,
        });
    });

    it("returns 400 when the friend ID is invalid", async () => {
        const response = await app.inject({
            method: "POST",
            url: "/friends/not-a-uuid/documents/ingest",
            payload: {
                title: "Relationship notes",
                documentType: "markdown",
                content: "Cole prefers planned calls.",
            },
        });

        expect(response.statusCode).toBe(400);
        expect(mockedGetFriendById).not.toHaveBeenCalled();
        expect(mockedIngestFriendDocument).not.toHaveBeenCalled();
    });

    it("returns 400 when the document body is invalid", async () => {
        const response = await app.inject({
            method: "POST",
            url: `/friends/${friendId}/documents/ingest`,
            payload: {
                title: "Relationship notes",
                documentType: "pdf",
                content: "Cole prefers planned calls.",
            },
        });

        expect(response.statusCode).toBe(400);
        expect(mockedGetFriendById).not.toHaveBeenCalled();
        expect(mockedIngestFriendDocument).not.toHaveBeenCalled();
    });

    it("returns 404 when the friend does not exist", async () => {
        mockedGetFriendById.mockResolvedValue(null);

        const response = await app.inject({
            method: "POST",
            url: `/friends/${friendId}/documents/ingest`,
            payload: {
                title: "Relationship notes",
                documentType: "markdown",
                content: "Cole prefers planned calls.",
            },
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toEqual({ error: "Friend not found" });
        expect(mockedIngestFriendDocument).not.toHaveBeenCalled();
    });
});
