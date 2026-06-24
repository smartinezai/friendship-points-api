import { randomUUID } from "node:crypto";
import { prisma } from "../../db/prisma.js";
import { DOCUMENT_CHUNK_SOURCE_TYPE } from "./documentSourceTypes.js";
import {
    prepareDocumentForIngestion,
    type PrepareDocumentForIngestionInput,
} from "./prepareDocumentForIngestion.js";

/**
 * Input required to ingest a raw document into friend-scoped searchable context.
 *
 * This extends the pure preparation input with `friendId`, because database
 * ingestion needs to know which friend's retrieval context should own the chunks.
 */
export type IngestFriendDocumentInput = PrepareDocumentForIngestionInput & {
    /**
     * Friend whose RAG/search context should receive the document chunks.
     */
    friendId: string;
};

/**
 * Summary returned after document chunks have been inserted into SearchableDocument.
 */
export type IngestFriendDocumentResult = {
    /**
     * Friend whose context received the ingested chunks.
     */
    friendId: string;

    /**
     * ID shared by every chunk created from this document ingestion.
     */
    documentId: string;

    /**
     * Trimmed title of the ingested document.
     */
    title: string;

    /**
     * Source document type.
     */
    documentType: "txt" | "markdown";

    /**
     * Number of SearchableDocument rows created.
     */
    createdChunkCount: number;

    /**
     * Source IDs assigned to the created chunks.
     *
     * These IDs are later useful for provenance, debugging, and citation checks.
     */
    sourceIds: string[];
};

/**
 * Prepares and stores a friend-scoped document as searchable document chunks.
 *
 * The first Day 34 implementation writes chunks directly into `SearchableDocument`
 * instead of introducing separate `Document` and `DocumentChunk` tables. This
 * keeps the ingestion flow compatible with the existing RAG/retrieval pipeline.
 *
 * @param input - Raw document content plus friend ownership metadata.
 * @returns Summary of inserted searchable document chunks.
 */
export async function ingestFriendDocument(
    input: IngestFriendDocumentInput,
): Promise<IngestFriendDocumentResult> {
    const preparedDocument = prepareDocumentForIngestion(input);

    const documentId = randomUUID();
    const sourceIds: string[] = [];

    const searchableDocumentRows = preparedDocument.chunks.map((chunk) => {
        /**
         * Generate the source ID inside the same map that creates the database row.
         *
         * This avoids indexing into a separate array with `sourceIds[index]`, which
         * TypeScript treats as possibly `undefined` when `noUncheckedIndexedAccess`
         * is enabled.
         */
        const sourceId = randomUUID();
        sourceIds.push(sourceId);

        return {
            friendId: input.friendId,
            sourceType: DOCUMENT_CHUNK_SOURCE_TYPE,
            sourceId,
            documentId,
            documentTitle: preparedDocument.title,
            documentType: preparedDocument.documentType,
            chunkIndex: chunk.chunkIndex,
            ...(chunk.sectionHeading === undefined
                ? {}
                : { sectionHeading: chunk.sectionHeading }),
            ...(preparedDocument.sourceDate === undefined
                ? {}
                : { sourceDate: preparedDocument.sourceDate }),
            content: [
                `Document title: ${preparedDocument.title}`,
                `Document type: ${preparedDocument.documentType}`,
                ...(chunk.sectionHeading === undefined
                    ? []
                    : [`Section heading: ${chunk.sectionHeading}`]),
                `Chunk index: ${chunk.chunkIndex}`,
                "",
                chunk.content,
            ].join("\n"),
        };
    });

    await prisma.searchableDocument.createMany({
        data: searchableDocumentRows,
    });

    return {
        friendId: input.friendId,
        documentId,
        title: preparedDocument.title,
        documentType: preparedDocument.documentType,
        createdChunkCount: preparedDocument.chunks.length,
        sourceIds,
    };
}
