/**
 * Normalises raw document text before it is stored or split into chunks.
 *
 * This helper intentionally performs conservative cleanup only:
 * - converts Windows line endings to Unix-style line endings;
 * - trims leading and trailing whitespace;
 * - collapses repeated blank lines;
 * - trims whitespace at the end of each line.
 *
 * It does not remove Markdown syntax yet because headings and bullet structure
 * can still be useful context for retrieval.
 *
 * @param content - Raw TXT or Markdown content submitted for ingestion.
 * @returns Cleaned text suitable for later chunking and ingestion.
 */
export function normaliseDocumentText(content: string): string {
    return content
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .split("\n")
        .map((line) => line.trimEnd())
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}