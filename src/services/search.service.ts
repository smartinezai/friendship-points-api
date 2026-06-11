import { prisma } from "../db/prisma.js";
import { createEmbedding, formatVectorForSql } from "./embeddings.service.js";

/**
 * createEmbedding(query)       → turns query text into number[]
formatVectorForSql(vector)   → turns number[] into pgvector SQL format

 */
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

export type RerankedContextItem = RetrievedContextItem & {
    rerankScore: number;
    rerankReason: string;
};

export type SemanticRetrievedContextItem = RetrievedContextItem & {
    distance: number;
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

function getSourceBoost(sourceType: RetrievedContextItem["sourceType"]): number {
    if (sourceType === "rule") {
        return 1.5;
    }

    if (sourceType === "event") {
        return 1;
    }

    return 0.5;
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

export function rerankContextItems(
    query: string,
    items: RetrievedContextItem[],
): RerankedContextItem[] {
    return items
        .map((item) => {
            const keywordScore = calculateKeywordScore(query, item.content);

            const sourceBoost = getSourceBoost(item.sourceType);

            const rerankScore = keywordScore + sourceBoost;

            return {
                ...item,
                rerankScore,
                rerankReason: `keywordScore=${keywordScore}, sourceBoost=${sourceBoost}`,
            };
        })
        .sort((a, b) => b.rerankScore - a.rerankScore);
}


/**
 * Legacy live-table keyword search used for comparison-only manual testing.
 * Main RAG flows should use retrieveFriendContext, which searches ingested
 * SearchableDocument records.
 *
 * @param friendId - Friend whose notes, rules, and events should be searched.
 * @param query - Keyword query used to rank matching records.
 * @returns Ranked live-table matches, or an empty array for missing friends.
 */
export async function legacySearchFriendContext(
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

/**
 * Retrieves relevant ingested context for a friend using embedding similarity.
 * Lower distance means the stored context is more semantically similar to the query.
 *
 * @param friendId - Friend whose searchable documents should be queried.
 * @param query - Event text or hypothetical action to retrieve context for.
 * @param options - Optional limit and source exclusion controls.
 * @returns Context items ranked by semantic similarity.
 */
export async function retrieveFriendContextSemantically(
    friendId: string,
    query: string,
    options: RetrieveFriendContextOptions = {},
): Promise<SemanticRetrievedContextItem[]> {
    const queryEmbedding = await createEmbedding(query);
    const queryVector = formatVectorForSql(queryEmbedding);
    const limit = options.limit ?? 5;

    const rows = await prisma.$queryRaw<
        {
            sourceType: string;
            sourceId: string;
            friendId: string;
            content: string;
            distance: number;
        }[]
    >`
        SELECT
            "sourceType",
            "sourceId",
            "friendId",
            "content",
            "embedding" <=> ${queryVector}::vector AS "distance"
        FROM "SearchableDocument"
        WHERE "friendId" = ${friendId}
          AND "embedding" IS NOT NULL
        ORDER BY "distance" ASC
        LIMIT ${limit}
    `;

    const results: SemanticRetrievedContextItem[] = [];

    for (const row of rows) {
        if (!isSearchableSourceType(row.sourceType)) {
            continue;
        }

        if (
            options.excludeSourceType === row.sourceType &&
            options.excludeSourceId === row.sourceId
        ) {
            continue;
        }

        results.push({
            sourceType: row.sourceType,
            sourceId: row.sourceId,
            friendId: row.friendId,
            content: row.content,
            score: 0,
            distance: row.distance,
        });
    }

    return results;
}