import { prisma } from "../db/prisma.js";

/**
 * Fetches one non-deleted friend by id.
 *
 * @param friendId - Friend id from a route parameter or service call.
 * @param ownerUserId - Current user that must own the friend.
 * @returns The active friend record, or null if it does not exist.
 */
export async function getFriendById(friendId: string, ownerUserId: string) {
    return prisma.friend.findFirst({
        where: { 
            id: friendId, 
            ownerUserId,
            deletedAt: null 
        },
    });

}
