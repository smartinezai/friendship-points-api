import type { FastifyInstance } from "fastify";
import { prisma } from "../db/prisma.js";
import { getFriendById } from "../services/friends.service.js";
import {
    createFriendBodySchema,
    updateFriendBodySchema,
    appendFriendNoteBodySchema,
} from "../schemas/friends.schema.js";
import {
    sendNotFoundError,
    sendValidationError,
    sendBadRequestError,
} from "../utils/httpErrors.js";
import { retrieveFriendContext, retrieveFriendContextSemantically } from "../services/search.service.js";
import { rebuildSearchableDocumentsForFriend } from "../services/searchIngestion.service.js";

/** Registers friend CRUD, notes, search, and search-index maintenance routes. */
export async function friendRoutes(app: FastifyInstance) {

    app.get<{ Querystring: { name?: string } }>("/friends/search", async (request, reply) => {
        const { name } = request.query;

        if (!name) {
            return sendBadRequestError(reply, "Name query parameter is required.");
        }
        const friends = await prisma.friend.findMany({
            where: {
                deletedAt: null,
                displayName: {
                    contains: name,
                    mode: "insensitive",
                },
            },
        });
        return { friends };

    });

    /** Manual endpoint for inspecting retrieved RAG context during development. */
    app.get<{
        Params: { id: string };
        Querystring: { query?: string };
    }>("/friends/:id/search-context", async (request, reply) => {
        const { id } = request.params;
        const { query } = request.query;

        if (!query) {
            return sendBadRequestError(reply, "Query parameter is required.");
        }

        const results = await retrieveFriendContext(id, query);

        return { results };
    });

    /** Manual endpoint for inspecting semantic vector retrieval during development. */
    app.get<{
        Params: { id: string };
        Querystring: { query?: string };
    }>("/friends/:id/search-context/semantic", async (request, reply) => {
        const { id } = request.params;
        const { query } = request.query;

        if (!query) {
            return sendBadRequestError(reply, "Query parameter is required.");
        }

        const results = await retrieveFriendContextSemantically(id, query, {
            limit: 5,
        });

        return { results };
    });

    app.post<{
        Params: { id: string };
    }>("/friends/:id/rebuild-search-index", async (request, reply) => {
        const { id } = request.params;
        const result = await rebuildSearchableDocumentsForFriend(id);

        if (!result) {
            return sendNotFoundError(reply, "Friend not found");
        }

        return reply.send({
            message: "Search index rebuilt successfully",
            createdDocCount: result.createdDocCount,
        });
    });

    app.get<{ Params: { id: string } }>("/friends/:id", async (request, reply) => {
        const { id } = request.params;

        const friend = await getFriendById(id);

        if (!friend) {
            return sendNotFoundError(reply, "Friend not found");
        }

        return { friend };
    });


    app.get("/friends", async () => {
        const friends = await prisma.friend.findMany({
            where: {
                deletedAt: null,
            },
        });

        return { friends };
    });

    app.post<{
        Body: {
            displayName: string;
            notes?: string;
            allowDuplicate?: boolean;
        }
    }>("/friends", async (request, reply) => {
        const parsedBody = createFriendBodySchema.safeParse(request.body);

        if (!parsedBody.success) {
            return sendValidationError(reply, parsedBody.error.issues);
        }

        const { displayName, notes, allowDuplicate } = parsedBody.data;

        const existingFriend = await prisma.friend.findFirst({
            where: { displayName, deletedAt: null }
        });

        if (existingFriend && !allowDuplicate) {
            reply.status(409);
            return {
                error: "Friend with this display name already exists",
                existingFriend,
            };

        }

        const friend = await prisma.friend.create({
            data: {
                displayName,
                notes: notes ?? null,
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
            return sendValidationError(reply, parsedBody.error.issues);
        }

        const existingFriend = await getFriendById(id);

        if (!existingFriend) {
            return sendNotFoundError(reply, "Friend not found");
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

    app.post<{
        Params: { id: string };
    }>("/friends/:id/notes/append", async (request, reply) => {
        const { id } = request.params;

        const parsedBody = appendFriendNoteBodySchema.safeParse(request.body);

        if (!parsedBody.success) {
            return sendValidationError(reply, parsedBody.error.issues);
        }

        const existingFriend = await getFriendById(id);

        if (!existingFriend) {
            return sendNotFoundError(reply, "Friend not found");
        }

        const { note } = parsedBody.data;

        // Preserve readable note history by separating appended notes.
        const updatedNotes = existingFriend.notes
            ? `${existingFriend.notes}\n\n${note}`
            : note;

        const updatedFriend = await prisma.friend.update({
            where: { id },
            data: { notes: updatedNotes },
        });

        return reply.send({ friend: updatedFriend });
    });

    app.delete<{
        Params: { id: string };
    }>("/friends/:id", async (request, reply) => {
        const { id } = request.params;

        const existingFriend = await getFriendById(id);

        if (!existingFriend) {
            return sendNotFoundError(reply, "Friend not found");
        }

        await prisma.friend.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        return reply.status(200).send({
            message: "Friend deleted successfully",
        });
    });


}
