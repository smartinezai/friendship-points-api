import { chunkDocumentText, type DocumentTextChunk } from "./chunkDocumentText.js";
import { normaliseDocumentText } from "./normaliseDocumentText.js";

/**
 * Input required to prepare a document for ingestion.
 *
 * This shape is intentionally close to the document-ingestion request schema,
 * but it stays service-focused so the function can be reused from routes,
 * scripts, or tests.
 */
export type PrepareDocumentForIngestionInput = {
    /**
     * Human-readable document title.
     */
    title: string;

    /**
     * Source document type, for example `txt` or `markdown`.
     */
    documentType: "txt" | "markdown";

    /**
     * Raw document content before cleanup.
     */
    content: string;

    /**
     * Optional source date from the original document.
     */
    sourceDate?: Date;

    /**
     * Maximum number of characters allowed in each prepared chunk.
     */
    maxChunkCharacters: number;
};

/**
 * Prepared document output used before database insertion.
 */
export type PreparedDocumentForIngestion = {
    /**
     * Original title after trimming.
     */
    title: string;

    /**
     * Document type accepted by the first ingestion version.
     */
    documentType: "txt" | "markdown";

    /**
     * Normalised full document text.
     */
    normalisedContent: string;

    /**
     * Ordered chunks generated from the normalised document.
     */
    chunks: DocumentTextChunk[];

    /**
     * Optional source date carried through for future metadata storage.
     */
    sourceDate?: Date;
};

/**
 * Prepares raw document text for future searchable/RAG ingestion.
 *
 * This function deliberately does not write to the database. It is a pure
 * preparation step: clean the text, split it into retrieval-oriented chunks,
 * and preserve lightweight metadata needed by the next ingestion stage.
 *
 * @param input - Raw document metadata and content.
 * @returns Normalised document content plus ordered chunks.
 */
export function prepareDocumentForIngestion(
    input: PrepareDocumentForIngestionInput,
): PreparedDocumentForIngestion {
    const normalisedContent = normaliseDocumentText(input.content);

    const chunks = chunkDocumentText(normalisedContent, {
        maxChunkCharacters: input.maxChunkCharacters,
    });

    return {
        title: input.title.trim(),
        documentType: input.documentType,
        normalisedContent,
        chunks,
        ...(input.sourceDate === undefined
            ? {}
            : { sourceDate: input.sourceDate }),
    };
}