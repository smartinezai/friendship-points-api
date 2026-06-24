import { describe, expect, it } from "vitest";
import {
    ingestDocumentBodySchema,
    ingestFriendDocumentParamsSchema,
} from "../schemas/document.schema.js";

describe("ingestDocumentBodySchema group tests", () => {
    it("case that accepts a valid text document ingestion body", () => {
        const result = ingestDocumentBodySchema.safeParse({
            title: "Cole notes",
            documentType: "txt",
            content: "Cole prefers planned calls over unexpected calls.",
            sourceDate: "2026-06-24",
        });

        expect(result.success).toBe(true);

        if (result.success) {
            expect(result.data.sourceDate).toBeInstanceOf(Date);
        }
    });

    it("case that accepts a valid markdown document ingestion body", () => {
        const result = ingestDocumentBodySchema.safeParse({
            title: "Relationship notes",
            documentType: "markdown",
            content: "## Communication\nCole dislikes unexpected calls.",
        });

        expect(result.success).toBe(true);
    });

    it("rejects an unsupported document type", () => {
        const result = ingestDocumentBodySchema.safeParse({
            title: "PDF upload",
            documentType: "pdf",
            content: "Pretend PDF text.",
        });

        expect(result.success).toBe(false);
    });

    it("rejects empty title and empty content", () => {
        const result = ingestDocumentBodySchema.safeParse({
            title: "   ",
            documentType: "txt",
            content: "   ",
        });

        expect(result.success).toBe(false);
    });
});

describe("ingestFriendDocumentParamsSchema", () => {
    it("accepts a valid friend ID", () => {
        const result = ingestFriendDocumentParamsSchema.safeParse({
            friendId: "5da77ede-2290-4ede-9839-d83a29a310e6",
        });

        expect(result.success).toBe(true);
    });

    it("rejects an invalid friend ID", () => {
        const result = ingestFriendDocumentParamsSchema.safeParse({
            friendId: "not-a-valid-uuid",
        });

        expect(result.success).toBe(false);
    });
});