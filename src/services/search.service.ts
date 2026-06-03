import { prisma } from "../db/prisma.js";

export type RetrieveFriendContextOptions = {
    excludeSourceType?: "friend_note" | "rule" | "event";
    excludeSourceId?: string;
    limit?: number; //optionally limit the number of retrieved context items, e.g. to control token count when passing to LLM
};

export type RetrievedContextItem = {
    sourceType: "friend_note" | "rule" | "event";
    sourceId: string;
    friendId: string;
    content: string;
    score: number;
};

export function tokenise(text: string): string[] {
    return text
        .toLowerCase()
        .split(/\W+/)
        .filter(Boolean);
}

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
 * Main RAG flows should use retrieveFriendContext, which searches
 * ingested SearchableDocument records.
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
                where: { active: true }, //retrieve active rules
            },
            events: true, //also retrieve events
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
    results.sort((a, b) => b.score - a.score);   //a-b for ascending, b-a for descending order sorting
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
 */
export async function retrieveFriendContext(
    friendId: string,
    query: string,
    options: RetrieveFriendContextOptions = {}, //allow excluding certain source types or specific records from the retrieved context
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
            continue; //skip this document if it matches the exclusion criteria
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
    const limit = options.limit ?? 5; //default limit to 5 if not specified
    return results.slice(0, limit);
}
