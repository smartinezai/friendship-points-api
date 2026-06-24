import { describe, expect, it } from "vitest";
import { chunkDocumentText } from "../services/documentIngestion/chunkDocumentText.js";

describe("chunkDocumentText", () => {
    it("keeps short text as one chunk", () => {
        const chunks = chunkDocumentText("Cole prefers planned calls.", {
            maxChunkCharacters: 100,
        });

        expect(chunks).toEqual([
            {
                chunkIndex: 0,
                content: "Cole prefers planned calls.",
            },
        ]);
    });

    it("preserves paragraph boundaries when combining paragraphs", () => {
        const chunks = chunkDocumentText(
            "First paragraph.\n\nSecond paragraph.",
            {
                maxChunkCharacters: 100,
            },
        );

        expect(chunks).toEqual([
            {
                chunkIndex: 0,
                content: "First paragraph.\n\nSecond paragraph.",
            },
        ]);
    });

    it("splits paragraphs into separate chunks when the combined text would be too long", () => {
        const chunks = chunkDocumentText(
            "First paragraph.\n\nSecond paragraph.",
            {
                maxChunkCharacters: 20,
            },
        );

        expect(chunks).toEqual([
            {
                chunkIndex: 0,
                content: "First paragraph.",
            },
            {
                chunkIndex: 1,
                content: "Second paragraph.",
            },
        ]);
    });

    it("splits a single long paragraph into smaller chunks", () => {
        const chunks = chunkDocumentText("abcdefghijklmnopqrstuvwxyz", {
            maxChunkCharacters: 10,
        });

        expect(chunks).toEqual([
            {
                chunkIndex: 0,
                content: "abcdefghij",
            },
            {
                chunkIndex: 1,
                content: "klmnopqrst",
            },
            {
                chunkIndex: 2,
                content: "uvwxyz",
            },
        ]);
    });

    it("rejects invalid chunk size", () => {
        expect(() =>
            chunkDocumentText("Some text", {
                maxChunkCharacters: 0,
            }),
        ).toThrow("maxChunkCharacters must be greater than 0");
    });
});