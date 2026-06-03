import { prisma } from "../db/prisma.js";

/**
 * Fetches one non-deleted friend by id.
 *
 * @param friendId - Friend id from a route parameter or service call.
 * @returns The active friend record, or null if it does not exist.
 */
export async function getFriendById(friendId: string) {
    return prisma.friend.findFirst({
        where: { 
            id: friendId, 
            deletedAt: null 
        },
    });

}
