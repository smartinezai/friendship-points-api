/**
 * Builds the canonical citation string used when an agent references retrieved context.
 *
 * This helper centralises citation formatting so tools, tests, smoke scripts,
 * and future API response formatters all use the same citation shape.
 *
 * Expected format:
 * `[sourceType: sourceId]`
 *
 * Example:
 * `[event: aa4e0523-356c-4db5-99f5-ef0d39ffc863]`
 *
 * @param sourceType - The type of stored context being cited, for example `event`, `rule`, or `friend_note`.
 * @param sourceId - The stable database ID of the original source record.
 * @returns A formatted citation string that can be copied directly into agent responses.
 */
export function formatSourceCitation(
    sourceType: string,
    sourceId: string,
): string {
    return `[${sourceType}: ${sourceId}]`;
}