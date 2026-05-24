import { prisma } from "../db/prisma.js";

export async function getEventWithFriendAndActiveRules(eventId: string) {
  return prisma.event.findUnique({
    where: { id: eventId },
    include: {
      friend: {
        include: {
          rules: {
            where: {
              active: true,
            },
          },
        },
      },
    },
  });
}