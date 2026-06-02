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
 * Function that rebuilds searchable documents for one active friend from their
 * notes, active rules and events
 * If a function uses await inside it, it muswt be async
 * If a function returns a promise, it can be async, but it doesn't have to be
 * if everything is synchronous, do not make it async
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
                where: { active: true }, //retrieve active rules
            },
            events: true, //also retrieve events
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