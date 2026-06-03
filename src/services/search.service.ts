import { prisma } from "../db/prisma.js";

export type RetrieveFriendContextOptions = {
    excludeSourceType?: "friend_note" | "rule" | "event";
    excludeSourceId?: string;
    /** Maximum number of context items to return. Keeps LLM prompts bounded. */
    limit?: number;
};

export type RetrievedContextItem = {
    sourceType: "friend_note" | "rule" | "event";
    sourceId: string;
    friendId: string;
    content: string;
    score: number;
};

/**
 * Splits free text into lowercase keyword tokens.
 *
 * @param text - User or stored text to search.
 * @returns Non-empty tokens suitable for simple keyword matching.
 */
export function tokenise(text: string): string[] {
    return text
        .toLowerCase()
        .split(/\W+/)
        .filter(Boolean);
}

/**
 * Scores a text by counting unique query tokens that also appear in the text.
 *
 * @param query - Search query provided by the caller.
 * @param text - Candidate text being ranked.
 * @returns Number of unique matching tokens. Higher means more relevant.
 */
export function calculateKeywordScore(query: string, text: string): number {
    const queryTokens = new Set(tokenise(query));
    const textTokens = new Set(tokenise(text));

    let score = 0;

    for (const queryToken of queryTokens) {
        if (textTokens.has(queryToken)) {
            score += 1;
        }
    }

    return score;
}


/**
 * Legacy live-table keyword search used for comparison/manual testing.
 * Main RAG flows should use retrieveFriendContext, which searches ingested
 * SearchableDocument records.
 *
 * @param friendId - Friend whose notes, rules, and events should be searched.
 * @param query - Keyword query used to rank matching records.
 * @returns Ranked live-table matches, or an empty array for missing friends.
 */
export async function searchFriendContext(
    friendId: string,
    query: string,
): Promise<RetrievedContextItem[]> {
    const friend = await prisma.friend.findFirst({
        where: {
            id: friendId,
            deletedAt: null,
        },
        include: {
            rules: {
                where: { active: true },
            },
            events: true,
        },
    });
    if (!friend) {
        return [];
    }
    const results: RetrievedContextItem[] = [];

    if (friend.notes) {
        const score = calculateKeywordScore(query, friend.notes);
        if (score > 0) {
            results.push({
                sourceType: "friend_note",
                sourceId: friend.id,
                friendId: friend.id,
                content: friend.notes,
                score,
            });
        }
    }

    for (const rule of friend.rules) {
        const searchableText = `${rule.title} ${rule.description}`;
        const score = calculateKeywordScore(query, searchableText);
        if (score > 0) {
            results.push({
                sourceType: "rule",
                sourceId: rule.id,
                friendId: friend.id,
                content: searchableText,
                score,
            });
        }
    }

    for (const event of friend.events) {
        const score = calculateKeywordScore(
            query,
            event.eventText,
        );

        if (score > 0) {
            results.push({
                sourceType: "event",
                sourceId: event.id,
                friendId: friend.id,
                content: event.eventText,
                score,
            });
        }
    }
    results.sort((a, b) => b.score - a.score);
    return results;
}

function isSearchableSourceType(
    sourceType: string,
): sourceType is RetrievedContextItem["sourceType"] {
    return ["friend_note", "rule", "event"].includes(sourceType);
}

/**
 * Retrieves relevant ingested context for a friend using keyword scoring.
 * Supports excluding a specific source, such as the event currently being assessed.
 *
 * @param friendId - Friend whose searchable documents should be queried.
 * @param query - Event text or hypothetical action to retrieve context for.
 * @param options - Optional limit and source exclusion controls.
 * @returns Ranked context items from SearchableDocument.
 */
export async function retrieveFriendContext(
    friendId: string,
    query: string,
    options: RetrieveFriendContextOptions = {},
): Promise<RetrievedContextItem[]> {
    const documents = await prisma.searchableDocument.findMany({
        where: { friendId },
    });

    const results: RetrievedContextItem[] = [];

    for (const doc of documents) {
        if (!isSearchableSourceType(doc.sourceType)) {
            continue;
        }

        if (
            options.excludeSourceType === doc.sourceType &&
            options.excludeSourceId === doc.sourceId
        ) {
            // Avoid retrieving the same event that is currently being assessed.
            continue;
        }

        const score = calculateKeywordScore(query, doc.content);

        if (score > 0) {
            results.push({
                sourceType: doc.sourceType,
                sourceId: doc.sourceId,
                friendId: doc.friendId,
                content: doc.content,
                score,
            });
        }
    }

    results.sort((a, b) => b.score - a.score);
    const limit = options.limit ?? 5;
    return results.slice(0, limit);
}
