/**

 * A single chunk produced from an ingested document.

 *

 * Chunks are the units we will later store in the searchable/RAG index. Keeping

 * the shape small here makes the first ingestion version easy to test and easy

 * to connect to `SearchableDocument` later.

 */

export type DocumentTextChunk = {

    /**

     * Zero-based position of the chunk inside the original document.

     *

     * This lets us preserve document order after splitting.

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

     * This is character-based for now because it is simple and deterministic.

     * Later, we may switch to token-based chunking for more accurate LLM context

     * sizing.

     */

    maxChunkCharacters: number;

};

/**

 * Splits normalised document text into ordered chunks.

 *

 * The first implementation is intentionally conservative:

 * - split on blank lines so paragraphs stay together when possible;

 * - append paragraphs to the current chunk until the max size would be exceeded;

 * - split very long paragraphs into smaller slices when they exceed the limit.

 *

 * @param text - Normalised document text.

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