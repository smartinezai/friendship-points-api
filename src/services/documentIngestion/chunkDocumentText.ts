/**
 * A single chunk produced from an ingested document.
 *
 * Chunks are future retrieval/evidence units. That means each chunk should be
 * small enough to stay focused, but large enough to preserve useful context.
 */
export type DocumentTextChunk = {
    /**
     * Zero-based position of the chunk inside the original document.
     *
     * This preserves source order after splitting.
     */
    chunkIndex: number;

    /**
     * Text content for this chunk.
     */
    content: string;
};

/**
 * Options controlling document chunking.
 */
export type ChunkDocumentTextOptions = {
    /**
     * Maximum number of characters allowed in one chunk.
     *
     * This is a safety cap, not the primary splitting principle. The primary
     * strategy is to keep coherent paragraphs or sections together.
     */
    maxChunkCharacters: number;
};

/**
 * Splits normalised document text into ordered, relevance-oriented chunks.
 *
 * First version strategy:
 * - split on blank lines to preserve paragraph/section boundaries;
 * - combine neighbouring paragraphs only while the chunk stays under the size cap;
 * - split oversized paragraphs only as a fallback.
 *
 * @param text - Normalised TXT or Markdown document text.
 * @param options - Chunking configuration.
 * @returns Ordered chunks suitable for later searchable-document ingestion.
 */
export function chunkDocumentText(
    text: string,
    options: ChunkDocumentTextOptions,
): DocumentTextChunk[] {
    if (options.maxChunkCharacters <= 0) {
        throw new Error("maxChunkCharacters must be greater than 0");
    }

    const paragraphs = text
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

    const chunks: DocumentTextChunk[] = [];
    let currentChunk = "";

    for (const paragraph of paragraphs) {
        if (paragraph.length > options.maxChunkCharacters) {
            if (currentChunk.length > 0) {
                chunks.push({
                    chunkIndex: chunks.length,
                    content: currentChunk,
                });
                currentChunk = "";
            }

            for (
                let startIndex = 0;
                startIndex < paragraph.length;
                startIndex += options.maxChunkCharacters
            ) {
                chunks.push({
                    chunkIndex: chunks.length,
                    content: paragraph.slice(
                        startIndex,
                        startIndex + options.maxChunkCharacters,
                    ),
                });
            }

            continue;
        }

        const candidateChunk =
            currentChunk.length === 0
                ? paragraph
                : `${currentChunk}\n\n${paragraph}`;

        if (candidateChunk.length <= options.maxChunkCharacters) {
            currentChunk = candidateChunk;
            continue;
        }

        chunks.push({
            chunkIndex: chunks.length,
            content: currentChunk,
        });

        currentChunk = paragraph;
    }

    if (currentChunk.length > 0) {
        chunks.push({
            chunkIndex: chunks.length,
            content: currentChunk,
        });
    }

    return chunks;
}