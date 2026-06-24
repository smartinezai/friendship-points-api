import { describe, expect, it } from "vitest";
import { DOCUMENT_CHUNK_SOURCE_TYPE } from "../services/documentIngestion/documentSourceTypes.js";

describe("DOCUMENT_CHUNK_SOURCE_TYPE", () => {
    it("uses the canonical searchable-document source type for document chunks", () => {
        expect(DOCUMENT_CHUNK_SOURCE_TYPE).toBe("document_chunk");
    });
});