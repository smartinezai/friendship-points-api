import { describe, expect, it } from "vitest";
import { prepareDocumentForIngestion } from "../services/documentIngestion/prepareDocumentForIngestion.js";

describe("prepareDocumentForIngestion", () => {
    it("normalises content and returns ordered chunks", () => {
        const result = prepareDocumentForIngestion({
            title: "  Cole notes  ",
            documentType: "txt",
            content:
                "Cole prefers planned calls.   \r\n\r\n\r\nUnexpected calls can feel disruptive.",
            maxChunkCharacters: 100,
        });

        expect(result.title).toBe("Cole notes");
        expect(result.documentType).toBe("txt");
        expect(result.normalisedContent).toBe(
            "Cole prefers planned calls.\n\nUnexpected calls can feel disruptive.",
        );
        expect(result.chunks).toEqual([
            {
                chunkIndex: 0,
                content:
                    "Cole prefers planned calls.\n\nUnexpected calls can feel disruptive.",
            },
        ]);
    });

    it("splits prepared content when the chunk size cap is reached", () => {
        const result = prepareDocumentForIngestion({
            title: "Communication notes",
            documentType: "markdown",
            content:
                "Cole prefers planned calls.\n\nUnexpected calls can feel disruptive.",
            maxChunkCharacters: 40,
        });

        expect(result.chunks).toEqual([
            {
                chunkIndex: 0,
                content: "Cole prefers planned calls.",
            },
            {
                chunkIndex: 1,
                content: "Unexpected calls can feel disruptive.",
            },
        ]);
    });

    it("preserves source date metadata", () => {
        const sourceDate = new Date("2026-06-24");

        const result = prepareDocumentForIngestion({
            title: "Dated notes",
            documentType: "txt",
            content: "Cole likes planned communication.",
            sourceDate,
            maxChunkCharacters: 100,
        });

        expect(result.sourceDate).toBe(sourceDate);
    });
});