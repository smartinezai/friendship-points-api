import { prisma } from "../db/prisma.js";


type SearchableDocumentInput = {
    friendId: string;
    sourceType: "friend_note" | "rule" | "event";
    sourceId: string;
    content: string;
};

type RebuildSearchIndexResult = {
    createdDocCount: number;
};

/**
 * Rebuilds all keyword-search documents for one active friend.
 *
 * The rebuild is destructive for that friend's existing searchable documents:
 * it deletes old indexed rows, then recreates documents from current notes,
 * active rules, and events.
 *
 * @param friendId - Friend whose searchable documents should be rebuilt.
 * @returns Created document count, or null when the friend is missing/deleted.
 */
export async function rebuildSearchableDocumentsForFriend(
    friendId: string,
): Promise<RebuildSearchIndexResult | null> {
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
        return null;
    }
    await prisma.searchableDocument.deleteMany({
        where: { friendId },
    });

    const documentsToCreate: SearchableDocumentInput[] = [];

    if (friend.notes) {
        documentsToCreate.push({
            friendId,
            sourceType: "friend_note",
            sourceId: friend.id,
            content: friend.notes,
        });
    }
    for (const rule of friend.rules) {
        documentsToCreate.push({
            friendId,
            sourceType: "rule",
            sourceId: rule.id,
            content: `${rule.title} ${rule.description}`,
        });
    }

    for (const event of friend.events) {
        documentsToCreate.push({
            friendId,
            sourceType: "event",
            sourceId: event.id,
            content: event.eventText,
        });
    }

    if (documentsToCreate.length > 0) {
        await prisma.searchableDocument.createMany({
            data: documentsToCreate,
        });
    }

    return { createdDocCount: documentsToCreate.length };
}
