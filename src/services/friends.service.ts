import { prisma } from "../db/prisma.js";

export async function getFriendById(friendId: string) {
    return prisma.friend.findUnique({
        where: { id: friendId },
    });

}

