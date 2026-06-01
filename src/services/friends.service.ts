import { prisma } from "../db/prisma.js";

export async function getFriendById(friendId: string) {
    return prisma.friend.findFirst({ //use findfirst when you need multiple conditions
        where: { 
            id: friendId, 
            deletedAt: null 
        }, //only return the friend if it has not been soft deleted
    });

}

