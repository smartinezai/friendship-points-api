import type { FastifyInstance } from "fastify";
import { prisma } from "../db/prisma.js";
import { getFriendById } from "../services/friends.service.js";

export async function eventRoutes(app: FastifyInstance) {

    app.get<{ Params: { friendId: string } }>("/friends/:friendId/events", async (request, reply) => {
        const { friendId } = request.params; //destructure friendId from request params, and type it as a string

        const friend = await getFriendById(friendId); //first check if the friend exists

        if (!friend) {
            reply.status(404);
            return { error: "Friend not found" };
        }
        const events = await prisma.event.findMany({
            where: { friendId },
        });
        return { events };
    });

    app.get<{ Params: { eventId: string } }>("/events/:eventId", async (request, reply) => {
        const { eventId } = request.params;

        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            reply.status(404);
            return { error: "Event not found" };
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
        const { friendId } = request.params; //destructure friendId from request params, and type it as a string
        const friend = await getFriendById(friendId); //first check if the friend exists

        if (!friend) {
            reply.status(404);
            return { error: "Friend not found" };
        }
        const { eventText, happenedAt } = request.body; //destructure body from request body, and type it as an object with the required fields
        if (
            !eventText ||
            eventText.trim() === ""
        ) {
            reply.status(400);
            return { error: "Event text is required" };
        }

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