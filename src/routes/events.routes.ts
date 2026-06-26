import type { FastifyInstance } from "fastify";
import { prisma } from "../db/prisma.js";
import { getFriendById } from "../services/friends.service.js";
import { getCurrentUserId } from "../services/currentUser.service.js";
import { createEventBodySchema } from "../schemas/events.schema.js";
import { sendNotFoundError, sendValidationError } from "../utils/httpErrors.js";

/** Registers event creation and lookup routes. */
export async function eventRoutes(app: FastifyInstance) {

    app.get<{ Params: { friendId: string } }>("/friends/:friendId/events", async (request, reply) => {
        const { friendId } = request.params;
        const ownerUserId = getCurrentUserId(request);

        const friend = await getFriendById(friendId, ownerUserId);

        if (!friend) {
            return sendNotFoundError(reply, "Friend not found");
        }
        const events = await prisma.event.findMany({
            where: { friendId },
        });
        return { events };
    });

    app.get<{ Params: { eventId: string } }>("/events/:eventId", async (request, reply) => {
        const { eventId } = request.params;
        const ownerUserId = getCurrentUserId(request);

        const event = await prisma.event.findFirst({
            where: {
                id: eventId,
                friend: { ownerUserId },
            },
        });

        if (!event) {
            return sendNotFoundError(reply, "Event not found");
        }

        return { event };
    });



    app.post<{
        Params: { friendId: string };
        Body: {
            eventText: string;
            happenedAt?: string;

        };
    }>("/friends/:friendId/events", async (request, reply) => {
        const { friendId } = request.params;
        const ownerUserId = getCurrentUserId(request);
        const friend = await getFriendById(friendId, ownerUserId);

        if (!friend) {
            return sendNotFoundError(reply, "Friend not found");
        }
        const parsedBody = createEventBodySchema.safeParse(request.body);

        if (!parsedBody.success) {
            return sendValidationError(reply, parsedBody.error.issues);
        }

        const { eventText, happenedAt } = parsedBody.data;

        const event = await prisma.event.create({
            data: {
                friendId,
                eventText,
                happenedAt: happenedAt ? new Date(happenedAt) : null,
            },
        });

        reply.status(201);
        return { event };
    });




}
