/**

 * Source type used when an ingested document chunk is stored in SearchableDocument.
 *
 * SearchableDocument.sourceType is currently a plain string in Prisma, so this
 * constant prevents typo-prone string literals like "document-chunk",
 * "document_chunk", or "doc_chunk" being scattered across the codebase.
 */

export const DOCUMENT_CHUNK_SOURCE_TYPE = "document_chunk";