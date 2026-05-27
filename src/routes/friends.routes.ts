import type { FastifyInstance } from "fastify";
import { prisma } from "../db/prisma.js";
import { getFriendById } from "../services/friends.service.js";
import { createFriendBodySchema, 
    updateFriendBodySchema, 
    appendFriendNoteBodySchema,
} from "../schemas/friends.schema.js";

export async function friendRoutes(app: FastifyInstance) {

    //this route must go before the /friends/:id route, otherwise it will be treated as a request for a friend with the id of "search"
    app.get<{ Querystring: { name?: string } }>("/friends/search", async (request, reply) => {
        const { name } = request.query;

        if (!name) {
            reply.status(400);
            return { error: "Name query parameter is required." };
        }
        const friends = await prisma.friend.findMany({
            where: {
                displayName: {
                    contains: name,
                    mode: "insensitive",
                },
            },
        });
        return { friends };

    });



    app.get<{ Params: { id: string } }>("/friends/:id", async (request, reply) => {
        const { id } = request.params; //destructure id from request params, and type it as a string

        const friend = await getFriendById(id);

        if (!friend) {
            reply.status(404);
            return { error: "Friend not found" };
        }

        return { friend };
    });



    app.get("/friends", async () => {
        // get all friends
        const friends = await prisma.friend.findMany();

        return { friends };
    });

    app.post<{
        Body: {
            displayName: string;
            notes?: string;
            allowDuplicate?: boolean;
        }
    }>("/friends", async (request, reply) => {
        const parsedBody = createFriendNBodySchema.safeParse(request.body);

        if (!parsedBody.success) {
            return reply.status(400).send({
                error: "Invalid request body",
                details: parsedBody.error.issues
            });
        }

        const { displayName, notes, allowDuplicate } = parsedBody.data;

        const existingFriend = await prisma.friend.findFirst({
            where: { displayName }
        });

        if (existingFriend && !allowDuplicate) {
            reply.status(409);// 409 Conflict status code indicates that the request could not be completed due to a conflict with the current state of the resource. In this case, it indicates that a friend with the same display name already exists and the client has not indicated that they want to allow duplicates.
            return {
                error: "Friend with this display name already exists",
                existingFriend,
            };

        }

        const friend = await prisma.friend.create({
            data: {
                displayName,
                notes: notes ?? null,  //use null if notes is undefined, since our schema expects a string or null
            },
        });

        reply.status(201);
        return { friend };
    });

    app.patch<{
        Params: { id: string };
    }>("/friends/:id", async (request, reply) => {
        const { id } = request.params;

        const parsedBody = updateFriendBodySchema.safeParse(request.body);

        if (!parsedBody.success) {
            return reply.status(400).send({
                error: "Invalid request body",
                details: parsedBody.error.issues,
            });
        }

        const existingFriend = await prisma.friend.findUnique({
            where: { id },
        });

        if (!existingFriend) {
            return reply.status(404).send({ error: "Friend not found" });
        }

        const updateData: {
            displayName?: string;
            notes?: string | null;
        } = {};

        if (parsedBody.data.displayName !== undefined) {
            updateData.displayName = parsedBody.data.displayName;
        }

        if (parsedBody.data.notes !== undefined) {
            updateData.notes = parsedBody.data.notes;
        }

        const updatedFriend = await prisma.friend.update({
            where: { id },
            data: updateData,
        });

        return reply.send({ friend: updatedFriend });
    });


    /**
     * //registering a post route that has type information
        <{ Params: { id: string } }>
            takes a path and an async function that takes a request and a reply
     */
    app.post<{
        Params: { id: string};
    }>("/friends/:id/notes/append", async (request, reply) => { 
        const { id } = request.params;

        const parsedBody = appendFriendNoteBodySchema.safeParse(request.body);

        if (!parsedBody.success) {
            return reply.status(400).send({
                error: "Invalid request body",
                details: parsedBody.error.issues,
            });
        }

        const existingFriend = await prisma.friend.findUnique({
            where: { id },
        });

        if (!existingFriend) {
            return reply.status(404).send({ error: "Friend not found" });
        }

        const { note } = parsedBody.data;
        
        /**
         * here we use a ternary operator
         * if existingFriend.notes already has something
         * then use old notes + blank line + new note
         * otherwise just use the new note
         */
        const updatedNotes = existingFriend.notes
            ? `${existingFriend.notes}\n\n${note}`
            : note;

        const updatedFriend = await prisma.friend.update({
            where: { id },
            data: { notes: updatedNotes },
        });

        return reply.send({ friend: updatedFriend });
    });     
}