import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/prisma.js", () => ({
    prisma: {
        searchableDocument: {
            createMany: vi.fn(),
        },
    },
}));

import { prisma } from "../db/prisma.js";
import { ingestFriendDocument } from "../services/documentIngestion/ingestFriendDocument.service.js";

const mockedCreateMany = vi.mocked(prisma.searchableDocument.createMany);

describe("ingestFriendDocument", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedCreateMany.mockResolvedValue({ count: 0 });
    });

    it("writes document metadata and section headings for every created chunk", async () => {
        const sourceDate = new Date("2026-06-24T00:00:00.000Z");

        const result = await ingestFriendDocument({
            friendId: "5da77ede-2290-4ede-9839-d83a29a310e6",
            title: "  Relationship notes  ",
            documentType: "markdown",
            content:
                "## Communication\nCole prefers planned calls.\n\n" +
                "## Conflict repair\nCole appreciates time to cool down.",
            sourceDate,
            maxChunkCharacters: 100,
        });

        expect(result).toMatchObject({
            friendId: "5da77ede-2290-4ede-9839-d83a29a310e6",
            title: "Relationship notes",
            documentType: "markdown",
            createdChunkCount: 2,
        });
        expect(result.documentId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u,
        );
        expect(new Set(result.sourceIds)).toHaveLength(2);

        expect(mockedCreateMany).toHaveBeenCalledWith({
            data: [
                expect.objectContaining({
                    friendId: result.friendId,
                    sourceType: "document_chunk",
                    documentId: result.documentId,
                    documentTitle: "Relationship notes",
                    documentType: "markdown",
                    sourceDate,
                    chunkIndex: 0,
                    sectionHeading: "Communication",
                    content: expect.stringContaining(
                        "Section heading: Communication",
                    ),
                }),
                expect.objectContaining({
                    friendId: result.friendId,
                    sourceType: "document_chunk",
                    documentId: result.documentId,
                    documentTitle: "Relationship notes",
                    documentType: "markdown",
                    sourceDate,
                    chunkIndex: 1,
                    sectionHeading: "Conflict repair",
                    content: expect.stringContaining(
                        "Section heading: Conflict repair",
                    ),
                }),
            ],
        });
    });

    it("does not write optional document metadata when it was not provided", async () => {
        await ingestFriendDocument({
            friendId: "5da77ede-2290-4ede-9839-d83a29a310e6",
            title: "Plain notes",
            documentType: "txt",
            content: "Cole prefers planned calls.",
            maxChunkCharacters: 100,
        });

        const createManyCall = mockedCreateMany.mock.calls[0];

        if (!createManyCall) {
            throw new Error("Expected document chunks to be written");
        }

        const createManyArgs = createManyCall[0];

        if (!createManyArgs || !Array.isArray(createManyArgs.data)) {
            throw new Error("Expected document chunks to be written as an array");
        }

        const firstRow = createManyArgs.data[0];

        if (!firstRow) {
            throw new Error("Expected one document chunk row");
        }

        expect(firstRow).not.toHaveProperty("sourceDate");
        expect(firstRow).not.toHaveProperty("sectionHeading");
    });
});
