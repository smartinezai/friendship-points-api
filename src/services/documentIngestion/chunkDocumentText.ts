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

    /**
     * Nearest preceding Markdown heading, when the chunk belongs to a section.
     */
    sectionHeading?: string;
};

type SectionParagraph = {
    content: string;
    sectionHeading?: string;
};

const markdownHeadingPattern = /^#{1,6}\s+(.+?)(?:\s+#+)?\s*$/u;

function getMarkdownHeading(line: string): string | undefined {
    const match = line.match(markdownHeadingPattern);
    const heading = match?.[1]?.trim();

    return heading || undefined;
}

function splitIntoSectionParagraphs(text: string): SectionParagraph[] {
    const paragraphs: SectionParagraph[] = [];
    let sectionHeading: string | undefined;

    for (const block of text.split(/\n{2,}/)) {
        const contentLines: string[] = [];

        const addContent = () => {
            const content = contentLines.join("\n").trim();

            if (content.length > 0) {
                paragraphs.push({
                    content,
                    ...(sectionHeading === undefined
                        ? {}
                        : { sectionHeading }),
                });
            }

            contentLines.length = 0;
        };

        for (const line of block.split("\n")) {
            const heading = getMarkdownHeading(line);

            if (heading !== undefined) {
                addContent();
                sectionHeading = heading;
                continue;
            }

            contentLines.push(line);
        }

        addContent();
    }

    return paragraphs;
}

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
 * - split on Markdown headings and blank lines to preserve section boundaries;
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

    const paragraphs = splitIntoSectionParagraphs(text);

    const chunks: DocumentTextChunk[] = [];
    let currentChunk = "";
    let currentSectionHeading: string | undefined;

    const addChunk = (content: string, sectionHeading: string | undefined) => {
        chunks.push({
            chunkIndex: chunks.length,
            content,
            ...(sectionHeading === undefined ? {} : { sectionHeading }),
        });
    };

    for (const paragraph of paragraphs) {
        if (
            currentChunk.length > 0 &&
            currentSectionHeading !== paragraph.sectionHeading
        ) {
            addChunk(currentChunk, currentSectionHeading);
            currentChunk = "";
        }

        currentSectionHeading = paragraph.sectionHeading;

        if (paragraph.content.length > options.maxChunkCharacters) {
            if (currentChunk.length > 0) {
                addChunk(currentChunk, currentSectionHeading);
                currentChunk = "";
            }

            for (
                let startIndex = 0;
                startIndex < paragraph.content.length;
                startIndex += options.maxChunkCharacters
            ) {
                addChunk(
                    paragraph.content.slice(
                        startIndex,
                        startIndex + options.maxChunkCharacters,
                    ),
                    currentSectionHeading,
                );
            }

            continue;
        }

        const candidateChunk =
            currentChunk.length === 0
                ? paragraph.content
                : `${currentChunk}\n\n${paragraph.content}`;

        if (candidateChunk.length <= options.maxChunkCharacters) {
            currentChunk = candidateChunk;
            continue;
        }

        addChunk(currentChunk, currentSectionHeading);

        currentChunk = paragraph.content;
    }

    if (currentChunk.length > 0) {
        addChunk(currentChunk, currentSectionHeading);
    }

    return chunks;
}
